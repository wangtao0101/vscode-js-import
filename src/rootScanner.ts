import * as vscode from 'vscode';
import * as fs from 'fs';
import Interpreter from './interpreter';
import JsImport from './jsImport';
import { kebab2camel, base2camel } from './help';
import { WorkspaceFolder, RelativePattern } from 'vscode';
const path = require('path');

export interface ImportObj {
    path: string;
    module: {
        /**
         * identifier name
         */
        name: string;
        /**
         * is default identifier
         */
        default: boolean;
        /**
         * is plain file
         */
        isPlainFile?: boolean;
        /**
         * should add member to import statement like import 'file.less'
         */
        isNotMember?: boolean;
    };
    isNodeModule: boolean;
}

export interface RootOptions {
    emptyMemberPlainFiles: Array<string>,
    defaultMemberPlainFiles : Array<string>,
    plainFilesGlob: string,
    filesToScan: string;
}

export default class RootScanner {

    private interpreter = new Interpreter();
    private workspaceFolder: WorkspaceFolder;
    private options: RootOptions;

    public cache = {};
    public nodeModuleCache = {};
    public nodeModuleVersion = {};

    constructor(workspaceFolder: WorkspaceFolder, options) {
        this.workspaceFolder = workspaceFolder;
        this.options = options;
    }

    public scanAllImport() {
        const relativePattern = new RelativePattern(this.workspaceFolder, this.options.filesToScan);
        // TODO: filter file not in src
        vscode.workspace.findFiles(relativePattern, '{**/node_modules/**}', 99999)
            .then((files) => this.processFiles(files));
        this.findModulesInPackageJson();
        this.processPlainFiles();
    }

    public scanFileImport(file: vscode.Uri) {
        this.deleteFile(file);
        this.processFile(file);
    }

    public deleteFile(file: vscode.Uri) {
        const keys = Object.keys(this.cache);
        for (const key of keys) {
            if (key.startsWith(file.fsPath)) {
                delete this.cache[key];
            }
        }
    }

    private processPlainFiles() {
        const relativePattern = new vscode.RelativePattern(this.workspaceFolder, this.options.plainFilesGlob);
        vscode.workspace.findFiles(relativePattern, '{**/node_modules/**}', 99999)
        .then((files) => {
            files.filter((f) => {
                return f.fsPath.indexOf('node_modules') === -1
            }).map((url) => {
                this.processPlainFile(url);
            })
        });
    }

    public processPlainFile(url: vscode.Uri) {
        const parsedFile = path.parse(url.fsPath);
        const name = base2camel(parsedFile.name);
        if (this.options.emptyMemberPlainFiles.includes(parsedFile.ext.replace('\.', ''))) {
            this.cache[`${url.fsPath}-${name}`] = {
                path: url.fsPath,
                module: {
                    default: true,
                    name,
                    isPlainFile: true,
                    isNotMember: true,
                },
                isNodeModule: false,
            };
        } else {
            this.cache[`${url.fsPath}-${name}`] = {
                path: url.fsPath,
                module: {
                    default: true,
                    name,
                    isPlainFile: true,
                },
                isNodeModule: false,
            };
        }
        JsImport.setStatusBar();
    }

    private processFiles(files: vscode.Uri[]) {
        files.forEach(file => {
            this.processFile(file);
        });
        return;
    }

    private processFile(file: vscode.Uri) {
        fs.readFile(file.fsPath, 'utf8', (err, data) => {
            if (err) {
                return console.log(err);
            }
            const fileName = path.parse(file.fsPath).name;
            // use for unnamed identifier
            const moduleName = path.basename(path.dirname(file.fsPath));
            const isIndex = fileName === 'index';
            const modules = this.interpreter.run(data, isIndex, moduleName, fileName);
            let defaultModule = null;
            let shouldParse = false;
            modules.forEach(m => {
                if (m.parse) {
                    shouldParse = true;
                    return;
                }
                this.cache[`${file.fsPath}-${m.name}`] = {
                    path: file.fsPath,
                    module: m,
                    isNodeModule: false,
                };
                if (m.default) {
                    defaultModule = m;
                }
            });
            if (shouldParse) {
                // only complex export should be parsed
                const parsedModules = this.interpreter.runMainFile(data, moduleName, file.fsPath);
                parsedModules.forEach(m => {
                    if (this.cache[`${file.fsPath}-${m.name}`] == null) {
                        if (m.default && defaultModule != null) {
                            return;
                        }
                        this.cache[`${file.fsPath}-${m.name}`] = {
                            path: file.fsPath,
                            module: m,
                            isNodeModule: false,
                        };
                    }
                });
            }
            JsImport.setStatusBar();
        });
    }

    public findModulesInPackageJson() {
        const modules = [];
        const packageJsonPath = path.join(this.workspaceFolder.uri.fsPath, 'package.json');
        if (fs.existsSync(packageJsonPath)) {
            fs.readFile(packageJsonPath, 'utf8', (err, data) => {
                if (err) {
                    return console.log(err);
                }
                const packageJson = JSON.parse(data);
                [
                    "dependencies",
                    "devDependencies",
                    "peerDependencies",
                    "optionalDependencies"
                ].forEach(key => {
                    if (packageJson.hasOwnProperty(key)) {
                        modules.push(...Object.keys(packageJson[key]));
                    }
                })
                this.deleteUnusedModules(modules);
                this.cacheModules(modules);
            })
        }
    }

    private deleteUnusedModules(modules: Array<string>) {
        const keys = Object.keys(this.nodeModuleCache);
        const notexists = keys.filter(key => !modules.includes(this.nodeModuleCache[key].path));
        notexists.forEach(name => {
            if (this.nodeModuleCache[name] != null) {
                delete this.nodeModuleVersion[this.nodeModuleCache[name].path];
                delete this.nodeModuleCache[name];
            }
        })
        JsImport.setStatusBar();
    }

    private cacheModules(modules) {
        modules.forEach((moduleName) => {
            const modulePath = path.join(this.workspaceFolder.uri.fsPath, 'node_modules', moduleName);
            const packageJsonPath = path.join(modulePath, 'package.json');
            if (fs.existsSync(packageJsonPath)) {
                fs.readFile(packageJsonPath, 'utf-8', (err, data) => {
                    if (err) {
                        return console.log(err);
                    }
                    const packageJson = JSON.parse(data);
                    if (!this.isCachedByVersion(moduleName, packageJson)) {
                        this.cacheModulesFromMain(moduleName, modulePath, packageJson);
                    }
                })
            }
        })
    }

    private cacheModulesFromMain(moduleName, modulePath, packageJson) {
        if (!packageJson.hasOwnProperty('main'))
            return;
        let mainFilePath = path.join(modulePath, packageJson.main);
        if (!fs.existsSync(mainFilePath)) {
            mainFilePath += '.js';
        }
        if (fs.existsSync(mainFilePath)) {
            fs.readFile(mainFilePath, 'utf-8', (err, data) => {
                if (err) {
                    return console.log(err);
                }
                const moduleKebabName = kebab2camel(moduleName)
                const modules = this.interpreter.run(data, true, moduleKebabName, '')
                let defaultModule = null;
                modules.forEach(m => {
                    if (m.parse) {
                        return;
                    }
                    this.nodeModuleCache[`${moduleName}-${m.name}`] = {
                        path: moduleName,
                        module: m,
                        isNodeModule: true,
                    };
                    if (m.default) {
                        defaultModule = m;
                    }
                });
                const parsedModules = this.interpreter.runMainFile(data, moduleKebabName, mainFilePath);
                parsedModules.forEach(m => {
                    if (this.nodeModuleCache[`${moduleName}-${m.name}`] == null) {
                        if (m.default && defaultModule != null) {
                            return;
                        }
                        this.nodeModuleCache[`${moduleName}-${m.name}`] = {
                            path: moduleName,
                            module: m,
                            isNodeModule: true,
                        };
                    }
                });
                JsImport.setStatusBar();
            });
        }
    }

    public isCachedByVersion(moduleName, packageJson) {
        if (packageJson.hasOwnProperty('version')) {
            if (this.nodeModuleVersion[moduleName] != null) {
                if (this.nodeModuleVersion[moduleName] === packageJson.version) {
                    return true
                } else {
                    this.nodeModuleVersion[moduleName] = packageJson.version;
                    return false;
                }
            } else {
                this.nodeModuleVersion[moduleName] = packageJson.version;
                return false;
            }
        }
        return false;
    }
}

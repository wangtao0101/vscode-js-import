import * as vscode from 'vscode';
import * as fs from 'fs';
import Interpreter from './interpreter';
import JsImport from './jsImport';
import { kebab2camel, base2camel } from './help';
const path = require('path');

export interface ImportObj {
    path: string;
    module: {
        /**
         * identifier名称
         */
        name: string;
        /**
         * 是否是default identifier
         */
        default: boolean;
        /**
         * 是否是文本文件
         */
        isPlainFile?: boolean;
        /**
         * 否要被加入import语句中，例如css，less文件
         */
        isNotMember?: boolean;
    };
    isNodeModule: boolean;
}

export default class Scanner {

    private interpreter = new Interpreter();
    public static cache = {};
    public static nodeModuleCache = {};
    public static nodeModuleVersion = {};

    public scanAllImport() {
        const filesToScan = vscode.workspace.getConfiguration('js-import').get<string>('filesToScan');
        vscode.workspace.findFiles(filesToScan, '{**/node_modules/**}', 99999)
            .then((files) => this.processFiles(files));
        this.findModulesInPackageJson();
        this.processPlainFiles();
    }

    public scanFileImport(file: vscode.Uri) {
        this.deleteFile(file);
        this.processFile(file);
    }

    public deleteFile(file: vscode.Uri) {
        const keys = Object.keys(Scanner.cache);
        for (const key of keys) {
            if (key.startsWith(file.fsPath)) {
                delete Scanner.cache[key];
            }
        }
    }

    private processPlainFiles() {
        vscode.workspace.findFiles(JsImport.plainFilesGlob, '{**/node_modules/**}', 99999)
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
        if (JsImport.emptyMemberPlainFiles.includes(parsedFile.ext.replace('\.', ''))) {
            Scanner.cache[`${url.fsPath}-${name}`] = {
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
            Scanner.cache[`${url.fsPath}-${name}`] = {
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
            const moduleName = path.basename(path.dirname(file.fsPath));
            const isIndex = fileName === 'index';
            const modules = this.interpreter.run(data, isIndex, moduleName, fileName);
            modules.forEach(m => {
                Scanner.cache[`${file.fsPath}-${m.name}`] = {
                    path: file.fsPath,
                    module: m,
                    isNodeModule: false,
                };
            });
            JsImport.setStatusBar();
        });
    }

    public findModulesInPackageJson() {
        const modules = [];
        const packageJsonPath = path.join(vscode.workspace.rootPath, 'package.json');
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
        const keys = Object.keys(Scanner.nodeModuleCache);
        const notexists = keys.filter(key => !modules.includes(Scanner.nodeModuleCache[key].path));
        notexists.forEach(name => {
            if (Scanner.nodeModuleCache[name] != null) {
                delete Scanner.nodeModuleVersion[Scanner.nodeModuleCache[name].path];
                delete Scanner.nodeModuleCache[name];
            }
        })
        JsImport.setStatusBar();
    }

    private cacheModules(modules) {
        modules.forEach((moduleName) => {
            const modulePath = path.join(vscode.workspace.rootPath, 'node_modules', moduleName);
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
                    Scanner.nodeModuleCache[`${moduleName}-${m.name}`] = {
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
                    if (Scanner.nodeModuleCache[`${moduleName}-${m.name}`] == null) {
                        if (m.default && defaultModule != null) {
                            return;
                        }
                        Scanner.nodeModuleCache[`${moduleName}-${m.name}`] = {
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
            if (Scanner.nodeModuleVersion[moduleName] != null) {
                if (Scanner.nodeModuleVersion[moduleName] === packageJson.version) {
                    return true
                } else {
                    Scanner.nodeModuleVersion[moduleName] = packageJson.version;
                    return false;
                }
            } else {
                Scanner.nodeModuleVersion[moduleName] = packageJson.version;
                return false;
            }
        }
        return false;
    }
}

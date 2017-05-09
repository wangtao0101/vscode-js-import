import * as vscode from 'vscode';
import * as fs from 'fs';
import Interpreter from './interpreter';
const path = require('path');

export default class Scanner {

    private interpreter = new Interpreter();
    private cache = {};

    public scan() {
        vscode.workspace.findFiles('**/*.{jsx,js}', '{**∕node_modules∕**, lib/**}', 99999)
        .then((files) => this.processFiles(files));

        // this.findModulesInPackageJson();
    }

    public processFiles(files: vscode.Uri[]) {
        let pruned = files.filter((f) => {
            return f.fsPath.indexOf('typings') === -1 &&
                f.fsPath.indexOf('node_modules') === -1
        });
        pruned.forEach(file => {
            fs.readFile(file.fsPath, 'utf8', (err, data) => {
                if (err) {
                    return console.log(err);
                }
                const fileName = path.parse(file.fsPath).name;
                const moduleName = path.basename(path.dirname(file.fsPath));
                const isIndex = fileName === 'index';
                console.log(this.interpreter.run(data, isIndex, moduleName, fileName));
                // this.interpreter.run(data, false, '', '');
            });
        });
    }

    private findModulesInPackageJson() {
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
                this.cacheModules(modules);
            })
        }
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
        const mainFilePath = path.join(modulePath, packageJson.main);
        if (fs.existsSync(mainFilePath)) {
            fs.readFile(mainFilePath, 'utf-8', (err, data) => {
                if (err) {
                    return console.log(err);
                }
                console.log(moduleName);
                console.log(this.interpreter.run(data, true, moduleName, ''));
                console.log('\n');
            });
        }
    }

    private isCachedByVersion(moduleName, packageJson) {
        if (packageJson.hasOwnProperty('version')) {
            if (this.cache[moduleName] != null) {
                if (this.cache[moduleName].version === packageJson.version) {
                    return true
                } else {
                    this.cache[moduleName].version = packageJson.version;
                    return false;
                }
            } else {
                this.cache[moduleName] = {
                    version: packageJson.version,
                }
                return false;
            }
        }
        this.cache[moduleName] = {};
        return false;
    }
}
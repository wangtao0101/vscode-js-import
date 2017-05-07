import * as vscode from 'vscode';
import * as fs from 'fs';
import Interpreter from './interpreter';
const path = require('path');

export default class Scanner {

    private interpreter = new Interpreter();
    private cache = [];

    public scan() {
        vscode.workspace.findFiles('**/*.{jsx,js}', '{**∕node_modules∕**, lib/**}', 99999)
        .then((files) => this.processFiles(files));

        this.findModulesInPackageJson();
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
                //console.log(this.interpreter.run(data));
                this.interpreter.run(data);
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
                modules.forEach(name => {
                    this.cacheModule(name);
                })
            })
        }
    }

    private cacheModule(moduleNmae) {
        const modulePath = path.join(vscode.workspace.rootPath, 'node_modules', moduleNmae);
        console.log(modulePath);
    }
}
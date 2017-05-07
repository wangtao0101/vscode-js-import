import * as vscode from 'vscode';
import * as fs from 'fs';
import Interpreter from './interpreter';

export default class Scanner {

    private interpreter = new Interpreter();

    public scan() {
        vscode.workspace.findFiles('**/*.{jsx,js}', '**∕node_modules∕**', 20)
        .then((files) => this.processFiles(files));
    }

    public processFiles(files: vscode.Uri[]) {
        files.forEach(file => {
            fs.readFile(file.fsPath, 'utf8', (err, data) => {
                if (err) {
                    return console.log(err);
                }
                console.log(file);
                console.log(this.interpreter.run(data));
                //this.interpreter.run(data);
            });
        });
    }

    private filterFiles() {

    }
}
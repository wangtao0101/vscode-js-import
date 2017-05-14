import Scanner, { ImportObj } from "./scanner";
import * as vscode from 'vscode';
const path = require('path');

export default class Resolver {
    private scanner;

    constructor(scanner: Scanner) {
        this.scanner = scanner;
    }

    resolve(value: string, doc: vscode.TextDocument, range: vscode.Range) {
        const cache = this.scanner.cache;
        let quickPickItems = [];
        for (const key of Object.keys(cache)) {
            if (cache[key].module.name === value) {
                if (!cache[key].isNodeModule) {
                    quickPickItems.push(this.resolveFromFile(cache[key], doc, range));
                } else {

                }
            }
        }
        vscode.window.showQuickPick(quickPickItems).then(item => {
            if(item) {
                vscode.commands.executeCommand('extension.fixImport',
                    item.importObj, item.doc, item.range);
            }
        })
    }

    resolveFromFile(importObj: ImportObj, doc: vscode.TextDocument, range: vscode.Range) {
        let rp = path.relative(vscode.workspace.rootPath, importObj.path);
        if (/^win/.test(process.platform)) {
            rp = rp.replace(/\\/g, '/');
        }
        return {
            label: `${importObj.module.name} ${rp}`,
            description: '',
            importObj: importObj,
            doc:doc,
            range: range,
        }
    }

    resolveFromModule(importObj) {

    }
}

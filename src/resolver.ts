import Scanner, { ImportObj } from "./scanner";
import * as vscode from 'vscode';
const path = require('path');

export default class Resolver {
    resolve(value: string, doc: vscode.TextDocument, range: vscode.Range) {
        const cache = Scanner.cache;
        const nodeModuleCache = Scanner.nodeModuleCache;
        let quickPickItems = [];
        for (const key of Object.keys(Scanner.cache)) {
            if (cache[key].module.name.toLowerCase() === value.toLowerCase()) {
                quickPickItems.push(this.resolveFromFile(cache[key], doc, range));
            }
        }
        for (const key of Object.keys(nodeModuleCache)) {
            if (nodeModuleCache[key].module.name.toLowerCase() === value.toLowerCase()) {
                quickPickItems.push(this.resolveFromModule(nodeModuleCache[key], doc, range));
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

    resolveFromModule(importObj: ImportObj, doc: vscode.TextDocument, range: vscode.Range) {
        return {
            label: `${importObj.module.name} node_modules/${importObj.path}`,
            description: '',
            importObj: importObj,
            doc:doc,
            range: range,
        }
    }
}

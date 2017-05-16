import * as vscode from 'vscode';
import { ImportObj } from "./scanner";
const path = require('path');

export default class ImportFixer {
    fix(importObj: ImportObj, doc: vscode.TextDocument , range: vscode.Range) {
        if (importObj.isNodeModule) {
            this.fixNodeModule(importObj, doc, range);
        } else {
            this.fixFile(importObj, doc, range);
        }
        // let edit: vscode.WorkspaceEdit = new vscode.WorkspaceEdit();
        // edit.insert(doc.uri, new vscode.Position(0, 0), `${importObj.module.name}\n`);
        // vscode.workspace.applyEdit(edit);
    }

    /**
     * from import form node_module dir
     */
    fixNodeModule(importObj: ImportObj, doc: vscode.TextDocument , range: vscode.Range) {

    }

    /**
     * fix import from local file
     */
    fixFile(importObj: ImportObj, doc: vscode.TextDocument , range: vscode.Range) {
        let alias = vscode.workspace.getConfiguration('js-import').get<string>('alias');
        let aliasMatch = null;
        let aliasKey = null;
        /**
         * pick up the first alias, not support nested alias
         */
        for(const key of Object.keys(alias)) {
            if (importObj.path.startsWith(path.join(vscode.workspace.rootPath, alias[key]))) {
                aliasMatch = alias[key];
                aliasKey = key;
            }
        }
        let importPath;
        if (aliasMatch !== null) {
            const filename = path.basename(importObj.path);
            const aliasPath = path.join(vscode.workspace.rootPath, aliasMatch);
            const relativePath = path.relative(aliasPath, path.dirname(importObj.path));
            if (filename.match(/index(\.(jsx|js))/)) {
                importPath = relativePath === '' ?  aliasKey : `${aliasKey}/${relativePath}`
            } else {
                const filename = path.parse(importObj.path).name;
                importPath = relativePath === '' ?  `${aliasKey}/${filename}` : `${aliasKey}/${relativePath}/${filename}`
            }
        }
        console.log(importPath)
    }
}

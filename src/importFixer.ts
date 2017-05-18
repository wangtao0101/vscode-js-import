import * as vscode from 'vscode';
import { ImportObj } from "./scanner";
const path = require('path');

export default class ImportFixer {
    public fix(importObj: ImportObj, doc: vscode.TextDocument , range: vscode.Range) {
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
    private fixNodeModule(importObj: ImportObj, doc: vscode.TextDocument , range: vscode.Range) {

    }

    /**
     * fix import from local file
     */
    private fixFile(importObj: ImportObj, doc: vscode.TextDocument , range: vscode.Range) {
        let importPath = this.extractImportPathFromAlias(importObj)
        console.log(importPath);
    }

    public extractImportPathFromAlias(importObj: ImportObj) {
        let aliasMatch = null;
        let aliasKey = null;
        const rootPath = vscode.workspace.rootPath;
        /**
         * pick up the first alias, not support nested alias
         */
        const alias = vscode.workspace.getConfiguration('js-import').get<string>('alias') || {};
        for(const key of Object.keys(alias)) {
            if (importObj.path.startsWith(path.join(rootPath, alias[key]))) {
                aliasMatch = alias[key];
                aliasKey = key;
            }
        }
        let importPath = null;
        if (aliasMatch !== null) {
            const filename = path.basename(importObj.path);
            const aliasPath = path.join(rootPath, aliasMatch);
            const relativePath = path.relative(aliasPath, path.dirname(importObj.path));
            if (filename.match(/index(\.(jsx|js))/)) {
                importPath = relativePath === '' ?  aliasKey : `${aliasKey}/${relativePath}`
            } else {
                const filename = path.parse(importObj.path).name;
                importPath = relativePath === '' ?  `${aliasKey}/${filename}` : `${aliasKey}/${relativePath}/${filename}`
            }
        }
        return importPath;
    }
}

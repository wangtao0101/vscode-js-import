import * as vscode from 'vscode';
import { ImportObj } from './scanner';
import { isIndexFile, isWin } from './help';
const path = require('path');

export default class ImportFixer {
    public fix(importObj: ImportObj, doc: vscode.TextDocument, range: vscode.Range) {
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
    private fixNodeModule(importObj: ImportObj, doc: vscode.TextDocument, range: vscode.Range) {

    }

    /**
     * fix import from local file
     */
    private fixFile(importObj: ImportObj, doc: vscode.TextDocument, range: vscode.Range) {
        let importPath = this.extractImportPathFromAlias(importObj)
        if (importPath === null) {
            importPath = this.extractImportFromRoot(importObj, doc.uri.fsPath);
        }
    }

    public extractImportPathFromAlias(importObj: ImportObj) {
        let aliasMatch = null;
        let aliasKey = null;
        const rootPath = vscode.workspace.rootPath;
        /**
         * pick up the first alias, currently not support nested alias
         */
        const alias = vscode.workspace.getConfiguration('js-import').get<string>('alias') || {};
        for (const key of Object.keys(alias)) {
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
            if (isIndexFile(filename)) {
                importPath = relativePath === '' ? aliasKey : `${aliasKey}/${relativePath}`
            } else {
                const filename = path.parse(importObj.path).name;
                importPath = relativePath === '' ? `${aliasKey}/${filename}` : `${aliasKey}/${relativePath}/${filename}`
            }
        }
        return importPath;
    }

    public extractImportFromRoot(importObj: ImportObj, filePath: string) {
        const rootPath = vscode.workspace.rootPath;
        let importPath = path.relative(filePath, importObj.path);
        const parsePath = path.parse(importPath);
        /**
         * normalize dir
         */
        let dir = parsePath.dir;
        if (isWin()) {
            dir = dir.replace(/\\/g, '/');
            dir = dir.replace(/../, '.');
        }
        if (isIndexFile(parsePath.base)) {
            importPath = `${dir}`
        } else {
            importPath = `${dir}/${parsePath.name}`;
        }
        return importPath;
    }

    public isAlreadyResolved(importObj: ImportObj, doc: vscode.TextDocument, importPath) {
        const importBodyRegex = new RegExp(`(?:import\\s+)(.*)(?:from\\s+[\'|\"]${importPath}[\'|\"])`)
        const importBodyMatch = importBodyRegex.exec(doc.getText());
        if (importBodyMatch !== null) {
            const importBody = importBodyMatch[1].trim();
        } else {

        }
    }
}

// TODO: import statement maybe have been comment
// TODO: sort all import statement by eslint rules

import * as vscode from 'vscode';
import strip from 'parse-comment-es6';
import { ImportObj } from './scanner';
import { isIndexFile, isWin } from './help';
const path = require('path');

export default class ImportFixer {
    public fix(importObj: ImportObj, doc: vscode.TextDocument, range: vscode.Range) {
        let importPath;
        if (importObj.isNodeModule) {
            importPath = this.extractImportPathFromNodeModules(importObj);
        } else {
            importPath = this.extractImportPathFromAlias(importObj)
            if (importPath === null) {
                importPath = this.extractImportFromRoot(importObj, doc.uri.fsPath);
            }
        }
        this.applyDocText(importObj, importPath, doc, range);
    }

    private applyDocText(importObj: ImportObj, importPath: string, doc: vscode.TextDocument, range: vscode.Range) {
        // TODO: delete range word if it the word is in a single
        const editString = this.getEditIfResolved(importObj, doc, importPath);
        if (editString !== 0) {
            let edit: vscode.WorkspaceEdit = new vscode.WorkspaceEdit();
            edit.replace(doc.uri, new vscode.Range(0, 0, doc.lineCount, 0), editString);
            vscode.workspace.applyEdit(edit);
        } else {
            let importStatement;
            if (importObj.module.default) {
                importStatement = this.getImportStatement(importObj.module.name, [], importPath, true);
            } else {
                importStatement = this.getImportStatement(null, [importObj.module.name], importPath, true);
            }
            let edit: vscode.WorkspaceEdit = new vscode.WorkspaceEdit();
            edit.insert(doc.uri, new vscode.Position(0, 0), importStatement);
            vscode.workspace.applyEdit(edit);
        }
    }

    public extractImportPathFromNodeModules(importObj: ImportObj) {
        return importObj.path;
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
        }
        dir = dir.replace(/../, '.');
        if (isIndexFile(parsePath.base)) {
            importPath = `${dir}`
        } else {
            if (dir.startsWith('./..')) {
                importPath = `${dir.substr(2, dir.length - 2)}/${parsePath.name}`;
            } else {
                importPath = `${dir}/${parsePath.name}`;
            }
        }
        return importPath;
    }

    private getEditIfResolved(importObj: ImportObj, doc: vscode.TextDocument, importPath) {
        return this.resolveImport(importObj, strip(doc.getText()).text, doc.getText(), importPath);
    }

    /**
     * return edit if the import has been resolved
     * @param importObj
     * @param stripText
     * @param originText
     * @param importPath
     * @return text value, 0 not resolve
     */
     // TODO: add test
    public resolveImport(importObj: ImportObj, stripText: string, originText: string, importPath) {
        // TODO: change import regex if import statement takes up multiple lines
        // TODO: support import * as xxx from 'aaa'
        const importBodyRegex = new RegExp(`(?:import\\s+)(.*)(?:from\\s+[\'|\"]${importPath}[\'|\"](?:\s*;){0,1})`)
        const importBodyMatch = importBodyRegex.exec(stripText);
        const importBracketRegex = /\{(.*)\}/;
        if (importBodyMatch !== null) {
            // TODO: here we can provide some error info if there has some import syntax mistake, such as two default import
            const importBody = importBodyMatch[1].trim();
            const importBracketMatch = importBracketRegex.exec(importBody);
            let defaultImport = null;
            let bracketImport = [];
            if (importBracketMatch === null) {
                /**
                 * here importBody must be single word or (aaa as ccc)
                 */
                defaultImport = importBody;
            } else {
                /**
                 * importBracketMatch[1] maybe like { aaa as ccc, aaa }
                 */
                bracketImport.push(...importBracketMatch[1]
                    .split(',')
                    .map(s => s.trim().replace(/[\r|\n]/g, ' ').replace(/\s+/g, ' '))
                    .filter(s => s !== '')
                );
                if (importBracketMatch.index === 0) {
                    // TODO: maybe there hava mistake if two defalut
                    defaultImport = importBody.slice(importBracketMatch[0].length, importBody.length).replace(/\s/g, '').split(',')[1];
                } else if (importBracketMatch.index + importBracketMatch[0].length === importBody.length) {
                    // TODO: maybe there hava mistake if two defalut
                    defaultImport = importBody.slice(0, importBracketMatch.index).replace(/\s/g, '').split(',')[0];
                } else {
                    // TODO: mistake, currently we just return null to insert new import statement;
                    return 0;
                }
            }

            // sort and remove weight bracketImport
            if (importObj.module.default === true) {
                if (defaultImport === null) {
                    defaultImport = importObj.module.name;
                } else {
                    // TODO: mistake
                    return 0;
                }
            } else {
                // we can clear up the import although importObj is already import
                if (!bracketImport.includes(importObj.module.name)) {
                    bracketImport.push(importObj.module.name);
                }
            }
            const importStatement = this.getImportStatement(defaultImport, bracketImport, importPath);
            // TODO: we must find the exact position to replace new importStatement
            return originText.replace(importBodyRegex, importStatement);
        } else {
            return 0;
        }
    }

    public getImportStatement(defaultImport: string, bracketImport: Array<string>, importPath: string, endline = false) {
        // TODO: split multiple lines if exceed character per line (use a parameter setting)
        if (defaultImport != null && bracketImport.length !== 0) {
            return `import ${defaultImport}, { ${bracketImport.join(', ')} } from '${importPath}'${endline ? '\r\n' : ''};`
        } else if (defaultImport == null && bracketImport.length !== 0) {
            return `import { ${bracketImport.join(', ')} } from '${importPath}';${endline ? '\r\n' : ''}`
        } else if (defaultImport != null && bracketImport.length === 0) {
            return `import ${defaultImport} from '${importPath}';${endline ? '\r\n' : ''}`
        } else {
            // do nothing
        }
    }
}

// TODO: sort all import statement by eslint rules

import parseImport from 'parse-import-es6';
import * as vscode from 'vscode';
import strip from 'parse-comment-es6';
import { ImportObj } from './scanner';
import { isIndexFile, isWin } from './help';
const path = require('path');

export default class ImportFixer {
    eol: string;
    doc: vscode.TextDocument;
    importObj: ImportObj;
    range: vscode.Range;

    constructor(importObj: ImportObj, doc: vscode.TextDocument, range: vscode.Range) {
        this.importObj = importObj;
        this.doc = doc;
        this.range = range;
        if (doc != null) {
            this.eol = doc.eol === vscode.EndOfLine.LF ? '\n' : '\r\n';
        }
    }

    public fix() {
        let importPath;
        if (this.importObj.isNodeModule) {
            importPath = this.extractImportPathFromNodeModules(this.importObj);
        } else {
            importPath = this.extractImportPathFromAlias(this.importObj)
            if (importPath === null) {
                importPath = this.extractImportFromRoot(this.importObj, this.doc.uri.fsPath);
            }
        }
        this.resolveImport(importPath);
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

    public resolveImport(importPath) {
        const imports = parseImport(this.doc.getText());
        const filteredImports = imports.filter(imp => imp.error === 0 && imp.moduleSpecifier === importPath);
        // TODO: merge imports

        if (filteredImports.length === 0) {
            let importStatement;
            if (this.importObj.module.default) {
                importStatement = this.getImportStatement(this.importObj.module.name, null, [],  importPath, true);
            } else {
                importStatement = this.getImportStatement(null, null, [this.importObj.module.name], importPath, true);
            }
            this.insertNewImport(imports, importStatement);
        }
    }

    public insertNewImport(imports, importStatement) {
        let newText = '';
        let position: vscode.Position = null;
        let pos = vscode.workspace.getConfiguration('js-import').get<string>('insertPosition') || 'last';
        if (pos !== 'first' && pos !== 'last') {
            pos = 'last'
        }
        if (pos === 'last' && imports.length !== 0) {
            const imp = imports[imports.length - 1];
            if (imp.trailingComments.length === 0) {
                position =  new vscode.Position(imp.loc.end.line + 1, 0);
            } else {
                newText += this.eol;
                position =  new vscode.Position(imp.trailingComments[imp.trailingComments.length - 1].loc.end.line + 1, 0);
            }
        }
        let edit: vscode.WorkspaceEdit = new vscode.WorkspaceEdit();
        edit.insert(this.doc.uri, position, newText + importStatement);
        vscode.workspace.applyEdit(edit);
        // const comments = strip(originText, { comment: true, range: true, loc: true, raw: true })
    }

    /**
     * https://tc39.github.io/ecma262/#prod-ImportClause
     * @param imp
     * @param importPath
     * @param endline
     */
    public getImportStatement(importedDefaultBinding, nameSpaceImport, namedImports, importPath: string, endline = false) {
        // TODO: split multiple lines if exceed character per line (use a parameter setting)

        if (importedDefaultBinding !== null &&　nameSpaceImport !== null) {
            return `import ${importedDefaultBinding}, { ${nameSpaceImport} } from '${importPath}'${endline ? this.eol : ''};`
        } else if (importedDefaultBinding !== null && namedImports.length !== 0) {
            return `import ${importedDefaultBinding}, { ${namedImports.join(', ')} } from '${importPath}'${endline ? this.eol : ''};`
        } else if (importedDefaultBinding !== null) {
            return `import ${importedDefaultBinding} from '${importPath}';${endline ? this.eol : ''}`
        } else if (nameSpaceImport !== null) {
            return `import ${nameSpaceImport} from '${importPath}';${endline ? this.eol : ''}`
        } else if (namedImports.length !== 0) {
            return `import { ${namedImports.join(', ')} } from '${importPath}';${endline ? this.eol : ''}`
        } else {
            // do nothing
        }
    }
}

// TODO: sort all import statement by eslint rules

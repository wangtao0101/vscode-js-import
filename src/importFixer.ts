import parseImport from 'parse-import-es6';
import * as vscode from 'vscode';
import strip from 'parse-comment-es6';
import { ImportObj } from './scanner';
import { isIndexFile, isWin } from './help';
const path = require('path');

export default class ImportFixer {
    queto: string;
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
        let queto = vscode.workspace.getConfiguration('js-import').get<string>('quote');
        this.queto = `'`;
        if (queto === 'doublequote') {
            this.queto = `"`;
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
        // TODO: here we can normalize moduleSpecifier
        const filteredImports = imports.filter(imp => imp.error === 0 && imp.moduleSpecifier === importPath);

        if (filteredImports.length === 0) {
            let importStatement;
            if (this.importObj.module.default) {
                importStatement = this.getSingleLineImport(this.importObj.module.name, null, [], importPath, true);
            } else {
                importStatement = this.getSingleLineImport(null, null, [this.importObj.module.name], importPath, true);
            }
            this.insertNewImport(imports, importStatement);
        } else {
            // TODO: merge imports
            this.replaceOldImport(filteredImports[0], importPath);
        }
    }

    public replaceOldImport(imp, importPath) {
        let importStatement;
        if (this.importObj.module.default) {
            if (imp.importedDefaultBinding !== null && imp.importedDefaultBinding === this.importObj.module.name) {
                // TODO: we can format code
                return;
            } else if (imp.importedDefaultBinding !== null && imp.importedDefaultBinding !== this.importObj.module.name) {
                // error , two default import
                return;
            } else {
                // imp.importedDefaultBinding === null
                if (imp.loc.start.line < imp.loc.end.line && imp.namedImports.length !== 0) {
                    this.getMultipleLineImport(imp, this.importObj.module.name, imp.nameSpaceImport, imp.namedImports, importPath);
                    return;
                }
                // TODO: if imp.middleComments is not empty, wo should extract all middle comment into end to avoid missing comments
                importStatement = this.getSingleLineImport(this.importObj.module.name, imp.nameSpaceImport, imp.namedImports, importPath, false);
            }
        } else {
            if (imp.nameSpaceImport !== null) {
                // error
                return;
            }
            if (imp.namedImports.includes(this.importObj.module.name)) {
                // TODO: we can format code
                return;
            }
            if (imp.loc.start.line < imp.loc.end.line) {
                this.getMultipleLineImport(imp, imp.importedDefaultBinding, imp.nameSpaceImport,
                    imp.namedImports.concat([this.importObj.module.name]), importPath);
                return;
            }
            importStatement = this.getSingleLineImport(imp.importedDefaultBinding, imp.nameSpaceImport,
                imp.namedImports.concat([this.importObj.module.name]), importPath, false);
        }
        let edit: vscode.WorkspaceEdit = new vscode.WorkspaceEdit();
        edit.replace(this.doc.uri, new vscode.Range(imp.loc.start.line, imp.loc.start.column,
            imp.loc.end.line, imp.loc.end.column), importStatement);
        this.deleteWordRange(edit);
        vscode.workspace.applyEdit(edit);
    }

    public insertNewImport(imports, importStatement) {
        let newText = importStatement;
        let position: vscode.Position = null;
        let pos = vscode.workspace.getConfiguration('js-import').get<string>('insertPosition') || 'last';
        if (pos !== 'first' && pos !== 'last') {
            pos = 'last'
        }
        if (pos === 'last' && imports.length !== 0) {
            const imp = imports[imports.length - 1];
            if (imp.trailingComments.length === 0) {
                position = new vscode.Position(imp.loc.end.line + 1, 0);
            } else {
                newText = this.eol + newText;
                position = new vscode.Position(imp.trailingComments[imp.trailingComments.length - 1].loc.end.line + 1, 0);
            }
        }

        if (imports.length === 0) {
            const comments = strip(this.doc.getText(), { comment: true, range: true, loc: true, raw: true }).comments;

            if (comments.length === 0) {
                newText = newText + this.eol;
                position = new vscode.Position(0, 0);
            } else {
                // exculde the first leading comment of the first import, if exist 'flow' 'Copyright' 'LICENSE'
                const ignoreComment = /@flow|license|copyright/i;
                let index = 0;
                let comment;
                for (; index < comments.length; index += 1) {
                    comment = comments[index];
                    if (!ignoreComment.test(comments[index].raw)) {
                        break;
                    }
                }
                if (index === comments.length) {
                    // should insert after every comment
                    newText = this.eol + newText;
                    position = new vscode.Position(comment.loc.end.line + 1, 0);
                } else {
                    if (index === 0) {
                        newText = newText + this.eol;
                        position = new vscode.Position(0, 0);
                    } else {
                        // should insert after previous current comment
                        newText = this.eol + newText;
                        comment = comments[index - 1];
                        position = new vscode.Position(comment.loc.end.line + 1, 0);
                    }
                }
            }
        }
        let edit: vscode.WorkspaceEdit = new vscode.WorkspaceEdit();
        edit.insert(this.doc.uri, position, newText);
        this.deleteWordRange(edit);
        vscode.workspace.applyEdit(edit);
    }

    /**
     * https://tc39.github.io/ecma262/#prod-ImportClause
     * @param imp
     * @param importPath
     * @param endline
     */
    public getSingleLineImport(importedDefaultBinding, nameSpaceImport, namedImports, importPath: string, endline = false) {
        let commaDangleImport = vscode.workspace.getConfiguration('js-import').get<string>('commaDangleImport') || 'never';
        let namedImportsText = null;
        if (commaDangleImport === 'always' && namedImports.length !== 0) {
            namedImportsText = `${namedImports.join(', ')},`
        } else {
            namedImportsText = `${namedImports.join(', ')}`
        }

        if (importedDefaultBinding !== null && nameSpaceImport !== null) {
            return `import ${importedDefaultBinding}, { ${nameSpaceImport} } from ${this.queto}${importPath}${this.queto}${endline ? this.eol : ''};`
        } else if (importedDefaultBinding !== null && namedImports.length !== 0) {
            return `import ${importedDefaultBinding}, { ${namedImportsText} } from ${this.queto}${importPath}${this.queto}${endline ? this.eol : ''};`
        } else if (importedDefaultBinding !== null) {
            return `import ${importedDefaultBinding} from ${this.queto}${importPath}${this.queto};${endline ? this.eol : ''}`
        } else if (nameSpaceImport !== null) {
            return `import ${nameSpaceImport} from ${this.queto}${importPath}${this.queto};${endline ? this.eol : ''}`
        } else if (namedImports.length !== 0) {
            return `import { ${namedImportsText} } from ${this.queto}${importPath}${this.queto};${endline ? this.eol : ''}`
        } else {
            // do nothing
        }
    }

    public getMultipleLineImport(imp, importedDefaultBinding, nameSpaceImport, namedImports, importPath) {
        // TODO: split multiple lines if exceed character per line (use a parameter setting)
        let newText = 'import ';
        let startline = imp.loc.start.line;
        let startcolumn = imp.loc.start.column;
        let endline = imp.loc.end.line;
        let endcolumn = imp.loc.end.column;
        if (importedDefaultBinding != null) {
            newText += importedDefaultBinding + ', {';
        } else {
            newText += ' {'
        }

        // handle comment of import or default import
        const defaultImportComments = imp.middleComments.filter(comment => comment.identifier.identifier === importedDefaultBinding || comment.identifier.type === 'Import');
        if (defaultImportComments.length != 0) {
            newText += ' ';
        }
        defaultImportComments.forEach(element => {
            newText += element.raw;
            startcolumn = Math.min(startcolumn, element.loc.start.column);
        });

        namedImports.forEach((element, index) => {
            newText += this.eol;
            // handle comment before identifier in previous line
            const beforeNamedImportsComments = imp.middleComments.filter(comment => comment.identifier.identifier === element && comment.loc.start.line < comment.identifier.loc.start.line);
            beforeNamedImportsComments.forEach(comment => {
                newText += `    ${comment.raw}${this.eol}`;
            });
            let commaDangleImport = vscode.workspace.getConfiguration('js-import').get<string>('commaDangleImport') || 'never';
            if (commaDangleImport === 'always' || commaDangleImport === 'always-multiline') {
                newText += `    ${element},`;
            } else {
                if (index === namedImports.length - 1) {
                    newText += `    ${element}`;
                } else {
                    newText += `    ${element},`;
                }
            }
            // handle comment after identifier
            const afterNamedImportsComments = imp.middleComments.filter(comment => comment.identifier.identifier === element && comment.loc.start.line >= comment.identifier.loc.start.line);
            if (afterNamedImportsComments.length != 0) {
                newText += ' ';
            }
            afterNamedImportsComments.forEach(comment => {
                newText += comment.raw;
            });
        });

        newText += `${this.eol}} from ${this.queto}${importPath}${this.queto};`;
        const comments = imp.middleComments.filter(comment => comment.identifier.type === 'From' || comment.identifier.type === 'ModuleSpecifier');
        if (comments.length != 0) {
            newText += ' ';
        }
        comments.forEach(comment => {
            newText += comment.raw;
            endcolumn = Math.max(endcolumn, comment.loc.end.column);
        });
        let edit: vscode.WorkspaceEdit = new vscode.WorkspaceEdit();
        edit.replace(this.doc.uri, new vscode.Range(startline, startcolumn, endline, endcolumn), newText);
        this.deleteWordRange(edit);
        vscode.workspace.applyEdit(edit);
    }

    public deleteWordRange(edit: vscode.WorkspaceEdit) {
        const line = this.doc.lineAt(this.range.start.line)
        if (line.text.trim() === this.doc.getText(this.range)) {
            edit.delete(this.doc.uri, line.rangeIncludingLineBreak);
        }
    }
}

// TODO: sort all import statement by eslint rules

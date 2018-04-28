import parseImport, { ImportDeclaration } from 'parse-import-es6';
import * as vscode from 'vscode';
import strip from 'parse-comment-es6';
import { isIndexFile, isWin, getImportOption } from './help';
import ImportStatement, { EditChange } from './importStatement';
import JsImport from './jsImport';
import { ImportObj } from './rootScanner';
import { Uri } from 'vscode';
const path = require('path');
var open = require("open");

function getImportDeclaration(importedDefaultBinding, nameSpaceImport, namedImports,
    importPath: string, position: vscode.Position): ImportDeclaration {
    return {
        importedDefaultBinding,
        namedImports,
        nameSpaceImport,
        loc: {
            start: {
                line: position.line,
                column: position.character,
            },
            end: {
                line: position.line,
                column: position.character,
            },
        },
        range: null,
        raw: '',
        middleComments: [],
        leadComments: [],
        trailingComments: [],
        moduleSpecifier: importPath,
        error: 0,
    }
}

export default class ImportFixer {
    eol: string;
    doc: vscode.TextDocument;
    importObj: ImportObj;
    range: vscode.Range;
    options;

    constructor(importObj: ImportObj, doc: vscode.TextDocument, range: vscode.Range, options) {
        this.importObj = importObj;
        this.doc = doc;
        this.range = range;
        if (doc != null) {
            this.eol = doc.eol === vscode.EndOfLine.LF ? '\n' : '\r\n';
        }
        this.options = options;
    }

    public fix() {
        try {
            let importPath;
            if (this.importObj.isNodeModule) {
                importPath = this.extractImportPathFromNodeModules(this.importObj);
            } else {
                importPath = this.extractImportPathFromAlias(this.importObj, this.doc.uri.fsPath);
                if (importPath === null) {
                    importPath = this.extractImportFromRoot(this.importObj, this.doc.uri.fsPath);
                }
            }
            this.resolveImport(importPath);
        } catch (error) {
            JsImport.consoleError(error);
            let body = '';
            body = this.doc.getText() + '\n\n';
            if (error && error.stack) {
                body += error.stack;
            }
            open('https://github.com/wangtao0101/vscode-js-import/issues/new?title=new&body=' + encodeURIComponent(body));
        }
    }

    public extractImportPathFromNodeModules(importObj: ImportObj) {
        return importObj.path;
    }

    public extractImportPathFromAlias(importObj: ImportObj, fsPath: string) {
        let aliasMatch = null;
        let aliasKey = null;
        const uri = Uri.file(fsPath);
        const rootPath = vscode.workspace.getWorkspaceFolder(uri).uri.fsPath;

        /**
         * pick up the first alias, currently not support nested alias
         */
        const alias = this.options.alias;
        for (const key of Object.keys(alias)) {
            if (importObj.path.startsWith(path.join(rootPath, alias[key]))) {
                aliasMatch = alias[key];
                aliasKey = key;
            }
        }
        let importPath = null;
        if (aliasMatch !== null) {
            const filename = path.basename(importObj.path);
            /**
             * absolute path of current alias module
             */
            const aliasPath = path.join(rootPath, aliasMatch);
            if (fsPath.startsWith(aliasPath)) {
                /**
                 * use relative path if doc.uri is in aliasPath
                 */
                return this.extractImportFromRoot(importObj, fsPath);
            }
            let relativePath = path.relative(aliasPath, path.dirname(importObj.path));
            if (isWin()) {
                relativePath = relativePath.replace(/\\/g, '/');
            }
            if (!importObj.module.isPlainFile && isIndexFile(filename)) {
                importPath = relativePath === '' ? aliasKey : `${aliasKey}/${relativePath}`
            } else {
                const parsePath = path.parse(importObj.path);
                const filename = importObj.module.isPlainFile ? parsePath.base : parsePath.name;
                importPath = relativePath === '' ? `${aliasKey}/${filename}` : `${aliasKey}/${relativePath}/${filename}`
            }
        }
        return importPath;
    }

    public extractImportFromRoot(importObj: ImportObj, filePath: string) {
        const rootPath = vscode.workspace.getWorkspaceFolder(Uri.file(filePath));
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
        if (dir.startsWith('./..')) {
            dir = dir.substr(2, dir.length - 2);
        }
        if (!importObj.module.isPlainFile && isIndexFile(parsePath.base)) {
            importPath = `${dir}`
        } else {
            const name = importObj.module.isPlainFile ? parsePath.base : parsePath.name;
            importPath = `${dir}/${name}`;
        }
        return importPath;
    }

    public resolveImport(importPath) {
        const imports = parseImport(this.doc.getText());
        // TODO: here we can normalize moduleSpecifier
        const filteredImports = imports.filter(imp => imp.error === 0 && imp.moduleSpecifier === importPath);

        let importStatement: ImportStatement = null;
        if (filteredImports.length === 0) {
            const position = this.getNewImportPositoin(imports);
            // TODO: skip name === 'name as cc'
            if (this.importObj.module.isNotMember) {
                importStatement = new ImportStatement(
                    getImportDeclaration(null, null, [], importPath, position),
                    getImportOption(this.eol, true, this.options),
                );
            } else if (this.importObj.module.default) {
                importStatement = new ImportStatement(
                    getImportDeclaration(this.importObj.module.name, null, [], importPath, position),
                    getImportOption(this.eol, true, this.options),
                );
            } else {
                importStatement = new ImportStatement(
                    getImportDeclaration(null, null, [this.importObj.module.name], importPath, position),
                    getImportOption(this.eol, true, this.options),
                );
            }
        } else {
            // TODO: merge import
            const imp = filteredImports[0];
            if (this.importObj.module.isNotMember) {
                return;
            }
            if (this.importObj.module.default) {
                if (imp.importedDefaultBinding !== null && imp.importedDefaultBinding === this.importObj.module.name) {
                    // TODO: we can format code
                    return;
                } else if (imp.importedDefaultBinding !== null && imp.importedDefaultBinding !== this.importObj.module.name) {
                    // error , two default import
                    return;
                } else {
                    // imp.importedDefaultBinding === null
                    importStatement = new ImportStatement(
                        Object.assign(imp, { importedDefaultBinding: this.importObj.module.name }),
                        getImportOption(this.eol, false, this.options),
                    );
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
                importStatement = new ImportStatement(
                    Object.assign(imp, { namedImports: imp.namedImports.concat([this.importObj.module.name]) }),
                    getImportOption(this.eol, false, this.options),
                );
            }
        }

        const iec: EditChange = importStatement.getEditChange();
        let edit: vscode.WorkspaceEdit = new vscode.WorkspaceEdit();
        edit.replace(this.doc.uri, new vscode.Range(iec.startLine, iec.startColumn, iec.endLine, iec.endColumn), iec.text);
        vscode.workspace.applyEdit(edit);
    }

    public getNewImportPositoin(imports) {
        let position: vscode.Position = null;
        let pos = this.options.insertPosition;
        if (pos !== 'first' && pos !== 'last') {
            pos = 'last'
        }
        if (pos === 'last' && imports.length !== 0) {
            const imp = imports[imports.length - 1];
            if (imp.trailingComments.length === 0) {
                position = new vscode.Position(imp.loc.end.line + 1, 0);
            } else {
                position = new vscode.Position(imp.trailingComments[imp.trailingComments.length - 1].loc.end.line + 1, 0);
            }
        }

        if (imports.length === 0) {
            const comments = strip(this.doc.getText(), { comment: true, range: true, loc: true, raw: true }).comments;

            if (comments.length === 0) {
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
                    position = new vscode.Position(comment.loc.end.line + 1, 0);
                } else {
                    if (index === 0) {
                        position = new vscode.Position(0, 0);
                    } else {
                        comment = comments[index - 1];
                        position = new vscode.Position(comment.loc.end.line + 1, 0);
                    }
                }
            }
        }
        return position;
    }
}

// TODO: sort all import statement by eslint rules

import { ImportDeclaration } from "parse-import-es6";

export interface ImportOption {
    eol: string,
    queto: string,
    commaDangle: string,
    maxLen: number,
    needLineFeed: boolean,
}

export interface EditChange {
    text: string,
    startLine: number,
    startColumn: number,
    endLine: number,
    endColumn: number,
}

export default class ImportStatement {
    impd: ImportDeclaration;
    option: ImportOption;

    constructor(
        impd: ImportDeclaration,
        option: ImportOption,
    ) {
        this.impd = impd;
        this.option = option;
    }

    public getEditChange() : EditChange{
        let text = null;
        if (this.impd.loc.start.line < this.impd.loc.end.line) {
            text =  this.toMultipleLineString();
        } else {
            text = this.toSingleLineString();
        }
        let startColumn = this.impd.loc.start.column;
        let endColumn = this.impd.loc.end.column;
        const importComments = this.impd.middleComments.filter(comment => comment.identifier.type === 'Import');
        importComments.forEach(comment => {
            startColumn = Math.min(startColumn, comment.loc.start.column);
        });
        const moduleSpecifierComments = this.impd.middleComments.filter(comment => comment.identifier.type === 'ModuleSpecifier');
        moduleSpecifierComments.forEach(comment => {
            endColumn = Math.max(endColumn, comment.loc.end.column);
        });
        if (this.option.needLineFeed) {
            text += this.option.eol;
        }
        return {
            text,
            startLine: this.impd.loc.start.line,
            startColumn,
            endLine: this.impd.loc.end.line,
            endColumn,
        }
    }

    public getEditChangeWithComments() {
        // TODO:
    }

    public merge(importStatement: ImportStatement) {
        // TODO:
    }

    /**
     * get import statement string if nowarp
     */
    public toSingleLineString() {
        let hasIdentifier = false;
        let statement = 'import';
        if (this.impd.importedDefaultBinding != null) {
            statement += ' ' + this.impd.importedDefaultBinding;
            hasIdentifier = true;
        }
        if (this.impd.nameSpaceImport != null) {
            if (hasIdentifier) {
                statement += ','
            }
            statement += ' ' + this.impd.nameSpaceImport;
            hasIdentifier = true;
        }
        if (this.impd.namedImports.length != 0) {
            if (hasIdentifier) {
                statement += ','
            }
            statement += ' ' + this.namedImportString();
        }
        statement += ` from ${this.option.queto}${this.impd.moduleSpecifier}${this.option.queto};`
        this.impd.middleComments.forEach(comment => {
            statement += ' ' + comment.raw;
        });
        if (this.isLineToLong(statement)) {
            return this.toMultipleLineString();
        }
        return statement;
    }

    /**
     * get multiple line import statement including middle comments
     * import xxx as xxxxxxxx, // comment
     *     from 'xxxx';
     * or
     * import xxx as xxxx, {
     *     xx as xxxxx;
     * } from 'xxx';
     */
    public toMultipleLineString() {
        let hasIdentifier = false;
        let statement = 'import ';
        if (this.impd.importedDefaultBinding != null) {
            statement += this.impd.importedDefaultBinding;
            hasIdentifier = true;
        }
        if (this.impd.nameSpaceImport != null) {
            if (hasIdentifier) {
                statement += ', '
            }
            statement += this.impd.nameSpaceImport;
            hasIdentifier = true;
        }
        const extraComments = this.impd.middleComments.filter(
            comment =>
                comment.identifier.type === 'Import'
                || comment.identifier.type === 'ImportedDefaultBinding'
                || comment.identifier.type === 'NameSpaceImport'
        );
        let extraCommentString = '';
        extraComments.forEach(comment => {
            extraCommentString += ` ${comment.raw}`;
        });
        if (this.impd.namedImports.length === 0) {
            statement += `${extraCommentString}${this.option.eol}    `;
        } else {
            if (hasIdentifier) {
                statement += ', '
            }
            statement += this.namedImportString(true, extraCommentString) + ' ';
        }
        statement += `from ${this.option.queto}${this.impd.moduleSpecifier}${this.option.queto};`;
        const endComments = this.impd.middleComments.filter(
            comment =>
                comment.identifier.type === 'From'
                || comment.identifier.type === 'ModuleSpecifier'
        );
        if (endComments.length !== 0) {
            endComments.forEach(comment => {
                statement += ` ${comment.raw}`;
            });
        }
        return statement;
    }

    /**
     * get namedImport string including comments of named import identifier
     * @param multiLine line mode
     * @param extraComment comments after '{' in multiple line mode
     */
    public namedImportString(multiLine = false, extraComment = '') {
        const trailingCommas = this.option.commaDangle === 'always' ? true :
            (multiLine && this.option.commaDangle === 'always-multiline' ? true : false);
        const elementBefore = multiLine ? `${this.option.eol}    ` : ' ';
        let statement = `{`;
        // only multLine can add extraComment, extraComment must be some single line comments
        if (multiLine && extraComment !== '') {
            statement += extraComment;
        }

        this.impd.namedImports.forEach((element, index) => {
            // handle comment before identifier in previous line, actually here 'if (multiLine) ' is redundant
            if (multiLine) {
                const beforeNamedImportsComments = this.impd.middleComments.filter(comment => comment.identifier.identifier === element && comment.loc.start.line < comment.identifier.loc.start.line);
                beforeNamedImportsComments.forEach(comment => {
                    statement += `${elementBefore}${comment.raw}`;
                });
            }
            if (trailingCommas) {
                statement += `${elementBefore}${element},`;
            } else {
                if (index === this.impd.namedImports.length - 1) {
                    statement += `${elementBefore}${element}`;
                } else {
                    statement += `${elementBefore}${element},`;
                }
            }
            // handle comment after identifier or in the same line
            const afterNamedImportsComments = this.impd.middleComments.filter(comment => comment.identifier.identifier === element && comment.loc.start.line >= comment.identifier.loc.start.line);
            afterNamedImportsComments.forEach(comment => {
                statement += ' ' + comment.raw;
            });
        });

        if (multiLine) {
            statement += `${this.option.eol}\}`;
        } else {
            statement += ' }';
        }
        return statement;
    }

    private isLineToLong(statement) {
        return this.option.maxLen !== -1 && statement.length > this.option.maxLen;
    }
}

// TODO: maybe we can format multiline comment, like padding 4 blank left, low priority

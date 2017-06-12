import { ImportDeclaration } from "parse-import-es6";

export interface ImportOption {
    eol: string,
    queto: string,
    commaDangle: string,
    maxLen: number
}

export interface Change {
    text: string,
    sline: number,
    scolumn: number,
    eline: number,
    ecolumn: number,
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

    /**
     * 返回change格式
     *
     */
    public toImportString() {
        if (this.impd.loc.start.line < this.impd.loc.end.line) {
            return this.toMultipleLineString();
        }
        return this.toSingleLineString();
    }

    public toImportStringWithComments() {
        // TODO:
    }

    public merge(importStatement: ImportStatement) {
        // TODO:
    }

    private toSingleLineString() {
        /**
         * 无需处理前置的注释，只处理import之后的注释，移到该行末尾
         * 判断是不是超出行范围了，如果超出，转入多行模式
         */
    }

    private toMultipleLineString() {
        // TODO:
        /**
         * 没有namedImport情况下，处理成
         * import xxx as xxxxxxxx, // comment
         *     from 'xxxx';
         * 有namedImport情况下, 处理成
         * import xxx as xxxx, {
         *     xx as xxxxx;
         * } from 'xxx';
         * 处理完毕后，无需检查每一行是否太长。
         */
    }

    public namedImportString(multiLine = false) {
        const trailingCommas = this.option.commaDangle === 'always' ? true :
            (multiLine && this.option.commaDangle === 'always-multiline' ? true : false);
        const elementBefore = multiLine ? `${this.option.eol}    ` : ' ';
        let statement = '{';

        this.impd.namedImports.forEach((element, index) => {
            // handle comment before identifier in previous line, actually here 'if' is redundant
            if (multiLine) {
                const beforeNamedImportsComments = this.impd.middleComments.filter(comment => comment.identifier.identifier === element && comment.loc.start.line < comment.identifier.loc.start.line);
                beforeNamedImportsComments.forEach(comment => {
                    statement += `    ${comment.raw}${this.option.eol}`;
                });
            }
            if (trailingCommas) {
                statement += `${elementBefore}${element}`;
            } else {
                if (index === this.impd.namedImports.length - 1) {
                    statement += `${elementBefore}${element}`;
                } else {
                    statement += `${elementBefore}${element},`;
                }
            }
            // handle comment after identifier or in the same line
            const afterNamedImportsComments = this.impd.middleComments.filter(comment => comment.identifier.identifier === element && comment.loc.start.line >= comment.identifier.loc.start.line);
            if (afterNamedImportsComments.length != 0) {
                statement += ' ';
            }
            afterNamedImportsComments.forEach(comment => {
                statement += comment.raw;
            });
        });

        if (multiLine) {
            statement += `${this.option.eol}\}`;
        }
        return statement;
    }

    private isLineToLong() {

    }
}

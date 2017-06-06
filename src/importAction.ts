import Scanner, { ImportObj } from "./scanner";
import Resolver from "./resolver";
import * as vscode from 'vscode';
const path = require('path');


export class ImportAction implements vscode.CodeActionProvider {

    // 'Via' is not defined. (no-undef)
    static eslintUndefRegExp = /^\'(\w+)\' is not defined\. \(no\-undef\)$/;

    // Cannot find name 'isWin'.
    static tsUndefRegExp = /^Cannot find name \'(\w+)\'\.$/;

    public provideCodeActions(document: vscode.TextDocument, range: vscode.Range,
        context: vscode.CodeActionContext, token: vscode.CancellationToken): vscode.Command[] {

        const result = [];

        context.diagnostics.forEach(d => {
            result.push(...this.processDiagnostic(d, document, range));
        })
        return result;
    }

    processDiagnostic(diagnostic: vscode.Diagnostic, document: vscode.TextDocument, range: vscode.Range) {
        const handlers = [];
        let name = null;
        const matchEslintUndef = diagnostic.message.match(ImportAction.eslintUndefRegExp);
        if (matchEslintUndef != null) {
            name = matchEslintUndef[1];
        }
        if (name == null) {
            const matchTsUndef = diagnostic.message.match(ImportAction.tsUndefRegExp);
            if (matchTsUndef != null) {
                name = matchTsUndef[1]
            }
        }
        if (name == null) {
            return handlers;
        }
        const items = new Resolver().resolveItems(name, document, range, false);
        items.forEach(item => {
            handlers.push({
                title: item.label,
                command: 'extension.fixImport',
                arguments: [item.importObj, item.doc, item.range]
            });
        });
        return handlers;
    }
}

import * as vscode from 'vscode';
import Resolver from "./resolver";


export class ImportCompletion implements vscode.CompletionItemProvider {
    public provideCompletionItems(document: vscode.TextDocument, position: vscode.Position,
        token: vscode.CancellationToken): Promise<vscode.CompletionItem[]> {

        let enabled = vscode.workspace.getConfiguration('js-import').get<string>('codeCompletion');
        let autofix = vscode.workspace.getConfiguration('js-import').get<string>('codeCompletionAction');

        if (!enabled) {
            return Promise.resolve([]);
        }

        return new Promise((resolve, reject) => {
            let wordToComplete = '';
            let range = document.getWordRangeAtPosition(position);
            if (range) {
                const startPosition = range.start;
                if (startPosition.character > 0) {
                    /**
                     * if the charator before word is '.', we don't need to return any items.
                     */
                    const start = new vscode.Position(startPosition.line, startPosition.character - 1);
                    const end = new vscode.Position(startPosition.line, startPosition.character);
                    const charBeforeRange = document.getText(new vscode.Range(start, end));
                    if (charBeforeRange === '.') {
                        return resolve([]);
                    }
                }

                wordToComplete = document.getText(new vscode.Range(range.start, position)).toLowerCase();
                const items = new Resolver().resolveItems(wordToComplete, document, range, false);
                const handlers = [];
                items.forEach(item => {
                    handlers.push({
                        label: item.importObj.module.name,
                        kind: vscode.CompletionItemKind.Reference,
                        detail: item.label,
                        documentation: '',
                        command: autofix ? { title: 'Autocomplete', command: 'extension.fixImport', arguments: [item.importObj, item.doc, item.range] } : null
                    });
                });
                return resolve(handlers);
            }
            return resolve([]);
        })
    }
}

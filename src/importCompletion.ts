import * as vscode from 'vscode';
import Resolver from "./resolver";


export class ImportCompletion implements vscode.CompletionItemProvider {
    public provideCompletionItems(document: vscode.TextDocument, position: vscode.Position,
        token: vscode.CancellationToken): Promise<vscode.CompletionItem[]> {

        let enabled = vscode.workspace.getConfiguration('js-import').get<string>('codeCompletion');

        if (!enabled) {
            return Promise.resolve([]);
        }

        return new Promise((resolve, reject) => {
            let wordToComplete = '';
            let range = document.getWordRangeAtPosition(position);
            if (range) {
                wordToComplete = document.getText(new vscode.Range(range.start, position)).toLowerCase();
                const items = new Resolver().resolveItems(wordToComplete, document, range, false);
                const handlers = [];
                items.forEach(item => {
                    handlers.push({
                        label: item.importObj.module.name,
                        kind: vscode.CompletionItemKind.Reference,
                        detail: item.label,
                        documentation: '',
                        command: { title: 'Autocomplete', command: 'extension.fixImport', arguments: [item.importObj, item.doc, item.range] }
                    });
                });
                return resolve(handlers);
            }
            return resolve([]);
        })
    }
}

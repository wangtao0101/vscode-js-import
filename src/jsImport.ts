import * as vscode from 'vscode';
import Scanner from './scanner';
import Resolver from './resolver';
import ImportFixer from './importFixer';

// TODO: support ts file

export default class JsImport {

    public static statusBar: vscode.StatusBarItem;

    public run(context: vscode.ExtensionContext) {
        let root = vscode.workspace.rootPath;
        if (!root) {
            return;
        }
        this.attachCommands(context);
        this.attachFileWatcher();
        JsImport.statusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 1);
        JsImport.statusBar.text = '$(search)...';
        JsImport.statusBar.tooltip = 'JsImport: Building import cache...';
        JsImport.statusBar.show();
        vscode.commands.executeCommand('extension.scanImport', { init: true });
    }

    private attachCommands(context: vscode.ExtensionContext) {
        const scanner = new Scanner();

        let importScanner = vscode.commands.registerCommand('extension.scanImport', (request) => {
            if (request.init) {
                scanner.scanAllImport();
            } else if (request.edit) {
                scanner.scanFileImport(request.file);
            } else {
                scanner.deleteFile(request.file);
            }
        });

        let shortcutImport = vscode.commands.registerCommand('extension.shortcutImport', () => {
            let editor = vscode.window.activeTextEditor;
            if (!editor) {
                // this._statusBarItem.hide();
                return;
            }

            let doc = editor.document;

            editor.selections.forEach((selection) => {
                if (selection.start.isEqual(selection.end)) {
                    const wordRange = doc.getWordRangeAtPosition(selection.start)
                    const value = doc.getText().substring(doc.offsetAt(wordRange.start), doc.offsetAt(wordRange.end));
                    new Resolver().resolve(value, doc, wordRange);
                } else {
                    // do nothing
                }
            });
        });

        let importFixer = vscode.commands.registerCommand('extension.fixImport', (importObj, doc, range) => {
            new ImportFixer().fix(importObj, doc, range);
        });

        context.subscriptions.push(importScanner, shortcutImport);
    }

    public attachFileWatcher() {
        let glob = vscode.workspace.getConfiguration('js-import').get<string>('filesToScan');
        let watcher = vscode.workspace.createFileSystemWatcher(glob);
        watcher.onDidChange((file: vscode.Uri) => {
            vscode.commands
                .executeCommand('extension.scanImport', { file, edit: true, init: false });
        })
        watcher.onDidCreate((file: vscode.Uri) => {
            vscode.commands
                .executeCommand('extension.scanImport', { file, edit: true, init: false });
        })
        watcher.onDidDelete((file: vscode.Uri) => {
            vscode.commands
                .executeCommand('extension.scanImport', { file, delete: true, init: false });
        })
    }

    public static setStatusBar() {
        JsImport.statusBar.text = `$(database) ${Object.keys(Scanner.cache).length}`;
        JsImport.statusBar.tooltip = `JsImport: ${Object.keys(Scanner.cache).length} import statements`;
    }
}

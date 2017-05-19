'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import Scanner from './scanner';
import Resolver from './resolver';
import ImportFixer from './importFixer';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    attachCommands(context);
    vscode.commands.executeCommand('extension.scanImport');
}

// this method is called when your extension is deactivated
export function deactivate() {
}

function attachCommands(context: vscode.ExtensionContext) {
    const scanner = new Scanner();

    let disposable = vscode.commands.registerCommand('extension.scanImport', () => {
        scanner.scan();
    });

    let shortcutImport = vscode.commands.registerCommand('extension.shortcutImport', () => {
        // The code you place here will be executed every time your command is executed
        let editor = vscode.window.activeTextEditor;
        if (!editor) {
            this._statusBarItem.hide();
            return;
        }

        let doc = editor.document;

        editor.selections.forEach((selection) => {
            if (selection.start.isEqual(selection.end)) {
                const wordRange = doc.getWordRangeAtPosition(selection.start)
                const value = doc.getText().substring(doc.offsetAt(wordRange.start), doc.offsetAt(wordRange.end));
                new Resolver(scanner).resolve(value, doc, wordRange);
            } else {
                // do nothing
            }
        });
    });

    let importFixer = vscode.commands.registerCommand('extension.fixImport', (importObj, doc, range) => {
        new ImportFixer().fix(importObj, doc, range);
    });

    context.subscriptions.push(disposable, shortcutImport);
}

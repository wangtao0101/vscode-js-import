'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import Scanner from './scanner';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    console.log('Congratulations, your extension "vscode-js-import" is now active!');

    // const scanner = new Scanner();
    // scanner.scan();

    // The command has been defined in the package.json file
    // Now provide the implementation of the command with  registerCommand
    // The commandId parameter must match the command field in package.json
    let disposable = vscode.commands.registerCommand('extension.sayHello', () => {
        // The code you place here will be executed every time your command is executed

        // Display a message box to the user
        const scanner = new Scanner();
        scanner.scan();
        vscode.window.showInformationMessage('Hello World!');
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
                console.log(value);
            } else {
                // do nothing
            }
        });

        // Display a message box to the user
        vscode.window.showInformationMessage('shortcutImport');
    });

    context.subscriptions.push(disposable, shortcutImport);
}

// this method is called when your extension is deactivated
export function deactivate() {
}
import * as vscode from 'vscode';
import Scanner from './scanner';
import Resolver from './resolver';
import ImportFixer from './importFixer';
import { ImportAction } from './importAction';
import { ImportCompletion } from "./importCompletion";

export default class JsImport {

    public static statusBar: vscode.StatusBarItem;
    public static emptyMemberPlainFiles = [];
    public static defaultMemberPlainFiles = [];
    public static plainFilesGlob = '';

    public run(context: vscode.ExtensionContext) {
        let root = vscode.workspace.rootPath;
        if (!root) {
            return;
        }

        /**
         * init config
         */
        const plainFileSuffix = vscode.workspace.getConfiguration('js-import').get<string>('plainFileSuffix');
        const plainFileSuffixWithDefaultMember = vscode.workspace.getConfiguration('js-import').get<string>('plainFileSuffixWithDefaultMember');
        JsImport.emptyMemberPlainFiles = plainFileSuffix.split(',').map((x) => x.trim());
        JsImport.defaultMemberPlainFiles = plainFileSuffixWithDefaultMember.split(',').map((x) => x.trim());
        JsImport.plainFilesGlob = `**/*.{${JsImport.emptyMemberPlainFiles.concat(JsImport.defaultMemberPlainFiles).join(',')}}`;

        this.attachCommands(context);
        // TODO: should redesign file watcher in muti root version
        this.attachFileWatcher();

        // TODO: should reshow search status after add new workspaceFolder
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
            } else if (request.delete) {
                scanner.deleteFile(request.file);
            } else if (request.nodeModule) {
                scanner.findModulesInPackageJson();
            } else {
                // do nothing
            }
        });

        let importPlainFileScanner = vscode.commands.registerCommand('extension.scanPlainFileImport', (request) => {
            if (request.create) {
                scanner.processPlainFile(request.file);
            } else {
                scanner.deleteFile(request.file);
            }
        });

        let shortcutImport = vscode.commands.registerCommand('extension.shortcutImport', () => {
            let editor = vscode.window.activeTextEditor;
            if (!editor) {
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
            new ImportFixer(importObj, doc, range).fix();
        });

        // TODO: suport config DocumentSelector
        let codeActionFixer = vscode.languages.registerCodeActionsProvider(
            ['javascript', 'typescript', 'javascriptreact', 'typescriptreact'], new ImportAction())

        let completetion = vscode.languages.registerCompletionItemProvider(
            ['javascript', 'typescript', 'javascriptreact', 'typescriptreact'], new ImportCompletion());

        context.subscriptions.push(importScanner, importPlainFileScanner, shortcutImport, codeActionFixer, completetion);
    }

    public attachFileWatcher() {
        // TODO: should add or delete filewatch after add or close workspaceFolder
        let glob = vscode.workspace.getConfiguration('js-import').get<string>('filesToScan');
        let watcher = vscode.workspace.createFileSystemWatcher(glob);
        watcher.onDidChange((file: vscode.Uri) => {
            vscode.commands
                .executeCommand('extension.scanImport', { file, edit: true, init: false, nodeModule: false });
        })
        watcher.onDidCreate((file: vscode.Uri) => {
            vscode.commands
                .executeCommand('extension.scanImport', { file, edit: true, init: false, nodeModule: false });
        })
        watcher.onDidDelete((file: vscode.Uri) => {
            vscode.commands
                .executeCommand('extension.scanImport', { file, delete: true, init: false, nodeModule: false });
        })

        let packageJsonWatcher = vscode.workspace.createFileSystemWatcher('**/package.json');
        packageJsonWatcher.onDidChange((file: vscode.Uri) => {
            vscode.commands
                .executeCommand('extension.scanImport', { file: null, edit: false, delete: false, init: false, nodeModule: true });
        })

        let plainFilesGlobWatcher = vscode.workspace.createFileSystemWatcher(JsImport.plainFilesGlob);
        plainFilesGlobWatcher.onDidDelete((file: vscode.Uri) => {
            vscode.commands
                .executeCommand('extension.scanPlainFileImport', { file, create: false });
        })
        plainFilesGlobWatcher.onDidCreate((file: vscode.Uri) => {
            vscode.commands
                .executeCommand('extension.scanPlainFileImport', { file, create: true });
        })
    }

    public static setStatusBar() {
        JsImport.statusBar.text = `$(database) ${Object.keys(Scanner.cache).length + Object.keys(Scanner.nodeModuleCache).length}`;
        JsImport.statusBar.tooltip = `JsImport : ${Object.keys(Scanner.cache).length + Object.keys(Scanner.nodeModuleCache).length} import statements`;
    }

    public static consoleError(error) {
        console.log('Sorry, some bugs may exist in vscode-js-import extension.');
        console.log('Please go to https://github.com/wangtao0101/vscode-js-import/issues to report the bug.');
        console.log("You'd better copy the below error stack and the current source file to the issue.");
        console.error(error);
    }
}

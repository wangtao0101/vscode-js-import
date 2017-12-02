import * as vscode from 'vscode';
import ImportFixer from './importFixer';
import { ImportAction } from './importAction';
import { ImportCompletion } from "./importCompletion";
import RootCache from './rootCache';
import { getRootOption } from './help';
const throttle = require('throttleit');

export default class JsImport {

    public static statusBar: vscode.StatusBarItem;

    public static rootCaches = {};

    public run(context: vscode.ExtensionContext) {
        vscode.workspace.workspaceFolders.map(item => {
            const cache = new RootCache(item);
            JsImport.rootCaches[item.uri.fsPath] = cache;
        })

        this.attachCommands(context);

        // TODO: should reshow search status after add new workspaceFolder
        JsImport.statusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 1);
        JsImport.statusBar.text = '$(search)...';
        JsImport.statusBar.tooltip = 'JsImport: Building import cache...';
        JsImport.statusBar.show();

        JsImport.setStatusBar = throttle(JsImport.setStatusBar, 1000);
        setTimeout(JsImport.setStatusBar, 5000);
    }

    private attachCommands(context: vscode.ExtensionContext) {
        const wfWatcher = vscode.workspace.onDidChangeWorkspaceFolders((event) => {
            event.added.map(item => {
                const cache = new RootCache(item);
                JsImport.rootCaches[item.uri.fsPath] = cache;
            })
            event.removed.map(item => {
                const rootCache = JsImport.rootCaches[item.uri.fsPath];
                if(rootCache) {
                    rootCache.dispose();
                    delete JsImport.rootCaches[item.uri.fsPath];
                }
            });
            JsImport.setStatusBar();
        })

        let importScanner = vscode.commands.registerCommand('extension.scanImport', (request) => {
            const rootCache = JsImport.getWorkspaceFolder(request.file);
            if (rootCache == null) {
                return;
            }

            if (request.edit) {
                rootCache.scanner.scanFileImport(request.file);
            } else if (request.delete) {
                rootCache.scanner.deleteFile(request.file);
            } else if (request.nodeModule) {
                rootCache.scanner.findModulesInPackageJson();
            } else {
                // do nothing
            }
        });

        let importPlainFileScanner = vscode.commands.registerCommand('extension.scanPlainFileImport', (request) => {
            const rootCache = JsImport.getWorkspaceFolder(request.file);
            if (rootCache == null) {
                return;
            }
            if (request.create) {
                rootCache.scanner.processPlainFile(request.file);
            } else {
                rootCache.scanner.deleteFile(request.file);
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

                    let quickPickItems = JsImport.resolveItems(value, doc, wordRange, false);
                    vscode.window.showQuickPick(quickPickItems).then(item => {
                        if (item) {
                            vscode.commands.executeCommand('extension.fixImport',
                                item.importObj, item.doc, item.range);
                        }
                    })
                } else {
                    // do nothing
                }
            });
        });

        let importFixer = vscode.commands.registerCommand('extension.fixImport', (importObj, doc, range) => {
            const options = getRootOption(doc.uri)
            new ImportFixer(importObj, doc, range, options).fix();
        });

        // TODO: suport config DocumentSelector
        let codeActionFixer = vscode.languages.registerCodeActionsProvider(
            ['javascript', 'typescript', 'javascriptreact', 'typescriptreact', 'vue'], new ImportAction())

        let completetion = vscode.languages.registerCompletionItemProvider(
            ['javascript', 'typescript', 'javascriptreact', 'typescriptreact', 'vue'], new ImportCompletion());

        context.subscriptions.push(wfWatcher, shortcutImport, codeActionFixer, completetion);
    }

    public static getWorkspaceFolder(uri): RootCache {
        const workspaceFolder = vscode.workspace.getWorkspaceFolder(uri);
        return JsImport.rootCaches[workspaceFolder.uri.fsPath];
    }

    public static resolveItems(value: string, doc: vscode.TextDocument, range: vscode.Range, completion: false) {
        const rootCache: RootCache = JsImport.getWorkspaceFolder(doc.uri)
        if (rootCache) {
            return rootCache.resolveItems(value, doc, range, completion);
        }
        return [];
    }

    public static setStatusBar() {
        const showList = [];
        let all = 0;
        Object.keys(JsImport.rootCaches).map(key => {
            const root: RootCache = JsImport.rootCaches[key];
            const number =  Object.keys(root.scanner.cache).length +  Object.keys(root.scanner.nodeModuleCache).length;
            showList.push(`\n${root.workspaceFolder.name} : ${number}`);
            all += number;
        })
        JsImport.statusBar.text = `$(database) ${all}`;
        JsImport.statusBar.tooltip = `JsImport\nall: ${all} import statements${showList.join('')}`;
        JsImport.statusBar.show();
    }

    public static consoleError(error) {
        console.log('Sorry, some bugs may exist in vscode-js-import extension.');
        console.log('Please go to https://github.com/wangtao0101/vscode-js-import/issues to report the bug.');
        console.log("You'd better copy the below error stack and the current source file to the issue.");
        console.error(error);
    }
}

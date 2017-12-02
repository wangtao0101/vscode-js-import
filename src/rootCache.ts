import RootScanner, { ImportObj } from './rootScanner';
import { WorkspaceFolder, RelativePattern, FileSystemWatcher } from 'vscode';
import * as vscode from 'vscode';
import JsImport from './jsImport';
import { isWin } from './help';

const path = require('path');
const leven = require('leven');

export default class RootCache {
    private fileWatcher: Array<FileSystemWatcher> = [];
    public scanner: RootScanner;
    public workspaceFolder: WorkspaceFolder;

    private options = {
        emptyMemberPlainFiles: [],
        defaultMemberPlainFiles: [],
        plainFilesGlob: '',
        filesToScan: '',
    }

    constructor(workspaceFolder: WorkspaceFolder) {
        this.workspaceFolder = workspaceFolder;
        const filesToScan = vscode.workspace.getConfiguration('js-import', this.workspaceFolder.uri).get<string>('filesToScan');
        const plainFileSuffix = vscode.workspace.getConfiguration('js-import', this.workspaceFolder.uri).get<string>('plainFileSuffix');
        const plainFileSuffixWithDefaultMember = vscode.workspace.getConfiguration('js-import', this.workspaceFolder.uri).get<string>('plainFileSuffixWithDefaultMember');

        this.options.filesToScan = filesToScan;
        this.options.emptyMemberPlainFiles = plainFileSuffix.split(',').map((x) => x.trim());
        this.options.defaultMemberPlainFiles = plainFileSuffixWithDefaultMember.split(',').map((x) => x.trim());
        this.options.plainFilesGlob = `**/*.{${this.options.emptyMemberPlainFiles.concat(this.options.defaultMemberPlainFiles).join(',')}}`;

        this.scanner = new RootScanner(workspaceFolder, this.options);

        this.scanAllImport();
        this.addFileWatcher();
    }

    public dispose() {
        this.removeFileWatcher();
    }

    private addFileWatcher() {
        const watcher = vscode.workspace.createFileSystemWatcher(new RelativePattern(this.workspaceFolder, this.options.filesToScan));
        watcher.onDidChange((file: vscode.Uri) => {
            vscode.commands
                .executeCommand('extension.scanImport', { file, edit: true, nodeModule: false });
        })
        watcher.onDidCreate((file: vscode.Uri) => {
            vscode.commands
                .executeCommand('extension.scanImport', { file, edit: true, nodeModule: false });
        })
        watcher.onDidDelete((file: vscode.Uri) => {
            vscode.commands
                .executeCommand('extension.scanImport', { file, delete: true, nodeModule: false });
        })

        const packageJsonWatcher = vscode.workspace.createFileSystemWatcher(new RelativePattern(this.workspaceFolder, '**/package.json'));
        packageJsonWatcher.onDidChange((file: vscode.Uri) => {
            vscode.commands
                .executeCommand('extension.scanImport', { file: null, edit: false, delete: false, nodeModule: true });
        })

        const plainFilesGlobWatcher = vscode.workspace.createFileSystemWatcher(new RelativePattern(this.workspaceFolder, this.options.plainFilesGlob));
        plainFilesGlobWatcher.onDidDelete((file: vscode.Uri) => {
            vscode.commands
                .executeCommand('extension.scanPlainFileImport', { file, create: false });
        })
        plainFilesGlobWatcher.onDidCreate((file: vscode.Uri) => {
            vscode.commands
                .executeCommand('extension.scanPlainFileImport', { file, create: true });
        })
        this.fileWatcher.push(watcher, packageJsonWatcher, plainFilesGlobWatcher);
    }

    private removeFileWatcher() {
        this.fileWatcher.map(fw => {
            fw.dispose();
        })
    }

    private scanAllImport() {
        this.scanner.scanAllImport();
    }

    /**
     * get items by value
     * TODO: sort by value
     * @param value desc value
     * @param doc
     * @param range
     * @param completion is auto complete mode
     */
    public resolveItems(value: string, doc: vscode.TextDocument, range: vscode.Range, completion: false) {
        // TODO: need sort ?
        // TODO: filter current file export
        try {
            let items = [];
            for (const key of Object.keys(this.scanner.cache)) {
                // skip current file export
                if (this.scanner.cache[key].path === doc.fileName) {
                    continue;
                }
                if (completion) {
                    if (this.scanner.cache[key].module.name.toLowerCase().startsWith(value.toLowerCase())) {
                        items.push(this.resolveFromFile(this.scanner.cache[key], doc, range));
                    }
                } else {
                    if (this.scanner.cache[key].module.name.toLowerCase().includes(value.toLowerCase())) {
                        items.push(this.resolveFromFile(this.scanner.cache[key], doc, range));
                    }
                }
            }
            for (const key of Object.keys(this.scanner.nodeModuleCache)) {
                if (completion) {
                    if (this.scanner.nodeModuleCache[key].module.name.toLowerCase().startsWith(value.toLowerCase())) {
                        items.push(this.resolveFromModule(this.scanner.nodeModuleCache[key], doc, range));
                    }
                } else {
                    if (this.scanner.nodeModuleCache[key].module.name.toLowerCase().includes(value.toLowerCase())) {
                        items.push(this.resolveFromModule(this.scanner.nodeModuleCache[key], doc, range));
                    }
                }
            }
            return items.sort(this.sortItem(value));
        } catch (error) {
            JsImport.consoleError(error);
        }
    }

    private resolveFromFile(importObj: ImportObj, doc: vscode.TextDocument, range: vscode.Range) {
        let rp = path.relative(vscode.workspace.rootPath, importObj.path);
        if (isWin) {
            rp = rp.replace(/\\/g, '/');
        }
        const label = importObj.module.isNotMember ?
            `import ${rp} [js-import]` : `import ${importObj.module.name} from ${rp} [js-import]`
        return {
            label,
            description: '',
            importObj: importObj,
            doc: doc,
            range: range,
        }
    }

    private resolveFromModule(importObj: ImportObj, doc: vscode.TextDocument, range: vscode.Range) {
        return {
            label: `import ${importObj.module.name} from node_modules/${importObj.path} [js-import]`,
            description: '',
            importObj: importObj,
            doc: doc,
            range: range,
        }
    }

    private getConfig() {

    }

    private sortItem(value: string) {
        return (a, b) => {
            return leven(value, a.importObj.module.name) - leven(value, b.importObj.module.name);
        }
    }
}

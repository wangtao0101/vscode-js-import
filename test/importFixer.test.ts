import * as assert from 'assert';
import * as vscode from 'vscode';
import ImportFixer from '../src/importFixer';

const path = require('path');

suite.only("extractImportPathFromAlias", () => {
    const importObj = {
        path: path.join(vscode.workspace.rootPath, 'src/package/index.js'),
        module: {
            default: false,
            name: 'abc',
        },
        isNodeModule: false,
    }

    test("should return alias module name", () => {
        const importFixer = new ImportFixer();
        assert.equal('helpalias', importFixer.extractImportPathFromAlias(importObj))
    });

    test("should return aliasname/$1", () => {
        const importFixer = new ImportFixer();
        importObj.path = path.join(vscode.workspace.rootPath, 'src/package/help/index.js')
        assert.equal('helpalias/help', importFixer.extractImportPathFromAlias(importObj))
    });
});

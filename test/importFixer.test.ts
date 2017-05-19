import * as assert from 'assert';
import * as vscode from 'vscode';
import ImportFixer from '../src/importFixer';

const path = require('path');

suite("extractImportPathFromAlias", () => {
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

suite("extractImportFromRoot", () => {
    const importObj = {
        path: path.join(vscode.workspace.rootPath, 'src/via.js'),
        module: {
            default: false,
            name: 'via',
        },
        isNodeModule: false,
    }

    test("should return ignore ./ if in parent dir", () => {
        const importFixer = new ImportFixer();
        assert.equal('../via', importFixer.extractImportFromRoot(importObj, path.join(vscode.workspace.rootPath, 'src/component/index.js')))
    });

    test("should return ./ + dirname", () => {
        const importFixer = new ImportFixer();
        assert.equal('./via', importFixer.extractImportFromRoot(importObj, path.join(vscode.workspace.rootPath, 'src/app.js')))
    });

    test("should return ./ + dirname exclude filename if filaname is index.js or index.jsx ", () => {
        const importFixer = new ImportFixer();
        importObj.path = path.join(vscode.workspace.rootPath, 'src/component/index.js'),
        assert.equal('./component', importFixer.extractImportFromRoot(importObj, path.join(vscode.workspace.rootPath, 'src/app.js')))
    });
});

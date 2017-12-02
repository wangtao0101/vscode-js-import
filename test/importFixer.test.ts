import * as assert from 'assert';
import * as vscode from 'vscode';
import ImportFixer from '../src/importFixer';
import { getRootOption } from './../src/help';

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

    const options = getRootOption(vscode.Uri.file(importObj.path))

    test("should return alias module name", () => {
        const importFixer = new ImportFixer(null, null, null, options);
        assert.equal('helpalias', importFixer.extractImportPathFromAlias(importObj, path.join(vscode.workspace.rootPath, 'src/api.js')))
    });

    test("should return aliasname/$1", () => {
        const importFixer = new ImportFixer(null, null, null, options);
        const newImportObj = Object.assign({}, importObj, {
            path: path.join(vscode.workspace.rootPath, 'src/package/help/index.js'),
        })
        assert.equal('helpalias/help', importFixer.extractImportPathFromAlias(newImportObj, path.join(vscode.workspace.rootPath, 'src/api.js')))
    });

    test("should return aliasname/$1/filename if plainfile", () => {
        const importFixer = new ImportFixer(null, null, null, options);
        const newImportObj = Object.assign({}, importObj, {
            path: path.join(vscode.workspace.rootPath, 'src/package/help/index.less'),
            module: {
                isPlainFile: true
            }
        })
        assert.equal('helpalias/help/index.less', importFixer.extractImportPathFromAlias(newImportObj, path.join(vscode.workspace.rootPath, 'src/api.js')))
    });

    test("should return relative when file path is in alias path", () => {
        const importFixer = new ImportFixer(null, null, null, options);
        assert.equal('.', importFixer.extractImportPathFromAlias(
            importObj, path.join(vscode.workspace.rootPath, 'src/package/api.js')))
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

    const options = getRootOption(vscode.Uri.file(importObj.path))

    test("should return ignore ./ if in parent dir", () => {
        const importFixer = new ImportFixer(null, null, null, options);
        assert.equal('../via', importFixer.extractImportFromRoot(importObj, path.join(vscode.workspace.rootPath, 'src/component/index.js')))
    });

    test("should return ./ + dirname", () => {
        const importFixer = new ImportFixer(null, null, null, options);
        assert.equal('./via', importFixer.extractImportFromRoot(importObj, path.join(vscode.workspace.rootPath, 'src/app.js')))
    });

    test("should return ./ + dir base if plainfile", () => {
        const importFixer = new ImportFixer(null, null, null, options);
        const obj = Object.assign({}, importObj,
            {
                path: path.join(vscode.workspace.rootPath, 'src/index.less'),
                module: {
                    isPlainFile: true
                }
            });
        console.log(obj)
        assert.equal('./index.less', importFixer.extractImportFromRoot(obj, path.join(vscode.workspace.rootPath, 'src/app.js')))
    });

    test("should return ./ + dirname exclude filename if filaname is index.js or index.jsx ", () => {
        const importFixer = new ImportFixer(null, null, null, options);
        importObj.path = path.join(vscode.workspace.rootPath, 'src/component/index.js'),
            assert.equal('./component', importFixer.extractImportFromRoot(importObj, path.join(vscode.workspace.rootPath, 'src/app.js')))
    });
});

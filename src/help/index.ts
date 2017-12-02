import * as vscode from 'vscode';
import { ImportOption } from '../importStatement';

/**
 * if the given filename's extname is index.jsx or index.js or index.ts
 * @param {string} filename
 */
export function isIndexFile(filename) {
    return /index(\.(jsx|js|ts))/.test(filename);
}

const isW = /^win/.test(process.platform);
export function isWin() {
    return isW;
}

export function kebab2camel(str) {
    return str.replace(/(\-[A-Za-z])/g, function (m) {
	    return m.toUpperCase().replace('-','');
    });
};

export function base2camel(str) {
    return str.replace(/(\.[A-Za-z])/g, function (m) {
	    return m.toUpperCase().replace('.','');
    });
};

export function getImportOption(eol, needLineFeed = false, options): ImportOption {
    return {
        eol,
        needLineFeed,
        semicolon: options.semicolon,
        queto: options.queto,
        commaDangle: options.commaDangle,
        maxLen: options.maxLen,
    }
}

export function getRootOption(uri) {
    return {
        insertPosition: vscode.workspace.getConfiguration('js-import', uri).get<string>('insertPosition') || 'last',
        alias: vscode.workspace.getConfiguration('js-import', uri).get<string>('alias') || {},
        semicolon: vscode.workspace.getConfiguration('js-import', uri).get<boolean>('semicolon') ? ';' : '',
        queto: vscode.workspace.getConfiguration('js-import', uri).get<string>('quote') === 'doublequote' ? '"' : "'",
        commaDangle: vscode.workspace.getConfiguration('js-import', uri).get<string>('commaDangleImport'),
        maxLen: parseInt(vscode.workspace.getConfiguration('js-import', uri).get<string>('maxLen')),
    }
}

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

export function getImportOption(eol): ImportOption {
    return {
        eol,
        queto: vscode.workspace.getConfiguration('js-import').get<string>('quote') === 'doublequote' ? '"' : "'",
        commaDangle: vscode.workspace.getConfiguration('js-import').get<string>('commaDangleImport'),
        maxLen: parseInt(vscode.workspace.getConfiguration('js-import').get<string>('maxLen')),
    }
}

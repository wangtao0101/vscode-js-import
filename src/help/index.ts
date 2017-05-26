
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

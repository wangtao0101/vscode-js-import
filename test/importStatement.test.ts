import * as assert from 'assert';
import ImportStatement, { ImportOption } from '../src/importStatement';
import parseImport from 'parse-import-es6';
import stripComment from 'parse-comment-es6';

const option : ImportOption = {
    eol: '\n',
    queto: '\'',
    commaDangle: 'always',
    maxLen: 100,
};

suite("ImportStatement Tests", () => {

    test("namedImportString", () => {
        const text = `
            import { a as b } from 'c';
        `
        // const imp = parseImport(text);
        // const my = new ImportStatement(imp, option);
        // const ccc = stripComment(text);
        // imp.
        // assert.deepEqual([{default: true, name: 'uuu'}], my.run(text, false, '', ''))
    });
});

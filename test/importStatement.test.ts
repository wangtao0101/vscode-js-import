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

suite("test namedImportString", () => {

    test("return namedImportString correctly", () => {
        const text = `
            import { a as b, ccc, ddd } from 'c';
        `
        const imp = parseImport(text);
        const my = new ImportStatement(imp[0], option);
        assert.equal('{ a as b, ccc, ddd, }', my.namedImportString());
    });

    test("return namedImportString with never commaDangle correctly", () => {
        const text = `
            import { a as b, ccc, ddd } from 'c';
        `
        const imp = parseImport(text);
        const my = new ImportStatement(imp[0], Object.assign({}, option, {commaDangle: 'never'}));
        assert.equal('{ a as b, ccc, ddd }', my.namedImportString());
    });

    test("return namedImportString multiLine correctly", () => {
const text = `
import {
    a as b,
    ccc,
    ddd,
} from 'c';
`
        const imp = parseImport(text);
        const my = new ImportStatement(imp[0], option);
assert.equal(`{
    a as b,
    ccc,
    ddd,
}`, my.namedImportString(true));
    });

    test("return namedImportString multiLine with all kinds of comments correctly", () => {
const text = `
import {
    // abcde
    // cdef
/* i am a bad comment */  a as b, /* i am a good comment */ // i am an end comment
    // cdf
    /**
     * s
     */
    ccc, // eslint-disable-line
    /**
     * i am a comment
     */
    ddd,
// ccccc
} from 'c';
`
        const imp = parseImport(text);
        const my = new ImportStatement(imp[0], option);
assert.equal(`{
    // abcde
    // cdef
    a as b, /* i am a bad comment */ /* i am a good comment */ // i am an end comment
    // cdf
    /**
     * s
     */
    ccc, // eslint-disable-line
    /**
     * i am a comment
     */
    ddd,
}`, my.namedImportString(true));
    });
});


suite.only("test toSingleLineString", () => {
    test("return toSingleLineString correctly", () => {
        const text = `
            import { a as b, ccc, ddd, } from 'c';
        `
        const imp = parseImport(text);
        const my = new ImportStatement(imp[0], option);
        assert.equal(`import { a as b, ccc, ddd, } from 'c';`, my.toSingleLineString());
    });

    test("return toSingleLineString with never commaDangle correctly", () => {
        const text = `
            import { a as b, ccc, ddd } from 'c';
        `
        const imp = parseImport(text);
        const my = new ImportStatement(imp[0], Object.assign({}, option, {commaDangle: 'never'}));
        assert.equal(`import { a as b, ccc, ddd } from 'c';`, my.toSingleLineString());
    });

    test("return toSingleLineString when only has default import correctly", () => {
        const text = `
            import a from 'c';
        `
        const imp = parseImport(text);
        const my = new ImportStatement(imp[0], option);
        assert.equal(`import a from 'c';`, my.toSingleLineString());
    });

    test("return toSingleLineString when only has nameSpaceImport import correctly", () => {
        const text = `
            import * as b from 'c';
        `
        const imp = parseImport(text);
        const my = new ImportStatement(imp[0], option);
        assert.equal(`import * as b from 'c';`, my.toSingleLineString());
    });

    test("return toSingleLineString when has default import and namedImports correctly", () => {
        const text = `
            import a, { a as b, ccc, ddd } from 'c';
        `
        const imp = parseImport(text);
        const my = new ImportStatement(imp[0], option);
        assert.equal(`import a, { a as b, ccc, ddd, } from 'c';`, my.toSingleLineString());
    });

    test("return toSingleLineString when has default import and nameSpaceImport correctly", () => {
        const text = `
            import a, * as b from 'c';
        `
        const imp = parseImport(text);
        const my = new ImportStatement(imp[0], option);
        assert.equal(`import a, * as b from 'c';`, my.toSingleLineString());
    });

    test("return toSingleLineString when has comments correctly", () => {
        const text = `
            /* a */ import a, * as b from 'c';//aaaa
        `
        const imp = parseImport(text);
        const my = new ImportStatement(imp[0], option);
        assert.equal(`import a, * as b from 'c'; /* a */ //aaaa`, my.toSingleLineString());
    });
});

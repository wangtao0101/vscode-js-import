import * as assert from 'assert';

import Scanner from '../src/scanner';

suite.only("isCachedByVersion", () => {
    const packageJson = {
        version: '111',
    }

    test("should return ture if module is cached", () => {
        const scanner = new Scanner();
        Scanner.nodeModuleVersion['aaa'] = '111'
        assert.equal(true, scanner.isCachedByVersion('aaa', packageJson))
    });

    test("should return false if module is not cached", () => {
        const scanner = new Scanner();
        assert.equal(false, scanner.isCachedByVersion('bbb', packageJson))
        assert.equal('111', Scanner.nodeModuleVersion['bbb']);
    });

    test("should return false if old moduleVersion is cached", () => {
        const scanner = new Scanner();
        Scanner.nodeModuleVersion['ccc'] = '000';
        assert.equal(false, scanner.isCachedByVersion('ccc', packageJson))
        assert.equal('111', Scanner.nodeModuleVersion['ccc']);
    });
});

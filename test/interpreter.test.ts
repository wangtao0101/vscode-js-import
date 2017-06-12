import * as assert from 'assert';

import Interpreter from '../src/interpreter';

suite("Interpreter Tests", () => {

    test("export default class uuu;", () => {
        const my = new Interpreter();
        const text = `
            export default class uuu;
        `
        assert.deepEqual([{default: true, name: 'uuu'}], my.run(text, false, '', ''))
    });

    test("export function* xxx;", () => {
        const my = new Interpreter();
        const text = `
            export function* xxx;
        `
        assert.deepEqual([{default: false, name: 'xxx'}], my.run(text, false, '', ''))
    });

    test("export interface ModuleItem", () => {
        const my = new Interpreter();
        const text = `
            export interface ModuleItem;
        `
        assert.deepEqual([{default: false, name: 'ModuleItem'}], my.run(text, false, '', ''))
    });

    test("export default config;", () => {
        const my = new Interpreter();
        const text = `
            export default config;
        `
        assert.deepEqual([{default: true, name: 'config'}], my.run(text, false, '', ''))
    });

    test("export class abc {};", () => {
        const my = new Interpreter();
        const text = `
            export class abc {};
        `
        assert.deepEqual([{default: false, name: 'abc'}], my.run(text, false, '', ''))
    });

    test("exports.eee = eee.cxx;", () => {
        const my = new Interpreter();
        const text = `
            exports.eee = eee.cxx;
        `
        assert.deepEqual([{default: false, name: 'eee'}], my.run(text, false, '', ''))
    });

    test("exports[\"default\"] = _grid.Col;", () => {
        const my = new Interpreter();
        const text = `
            exports["default"] = _grid.Col;
        `
        // TODO: should interpreter the name
        assert.deepEqual([{default: true, name: 'grid'}], my.run(text, false, '', ''))
    });

    test("defineProperty", () => {
        const my = new Interpreter();
        const text = `
            Object.defineProperty( exports , 'version', {
                enumerable: true,
                get: function get() {
                    return _interopRequireDefault(_version)["default"];
                }
            });
        `
        assert.deepEqual([{default: false, name: 'version'}], my.run(text, false, '', ''))
    });

    test("export block", () => {
        const my = new Interpreter();
        const text = `
            export {
                aaa,
                bbb,
            };
        `
        assert.deepEqual([{default: false, name: 'aaa'}, {default: false, name: 'bbb'}], my.run(text, false, '', ''))
    });

    test("module.exports = _Sortable2.default;", () => {
        const my = new Interpreter();
        const text = `
            module.exports = _Sortable2.default;
        `
        assert.deepEqual([{default: true, name: 'Sortable'}], my.run(text, false, '', ''))
    });

    test("exports.default = _parseImport2.default;", () => {
        const my = new Interpreter();
        const text = `
            exports.default = _parseImport2.default;
        `
        assert.deepEqual([{default: true, name: 'parseImport'}], my.run(text, false, '', ''))
    });
});

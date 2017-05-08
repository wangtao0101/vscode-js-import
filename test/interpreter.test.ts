import * as assert from 'assert';

import Interpreter from '../src/interpreter';

suite.only("Interpreter Tests", () => {

    // Defines a Mocha unit test
    test("Something 1", () => {
        const my = new Interpreter();
        const text = `
            export default class uuu
            export class abc {};
            exports.eee = eee.cxx;
            exports["default"] = _grid.Col;
            Object.defineProperty( exports , 'version', {
                enumerable: true,
                get: function get() {
                    return _interopRequireDefault(_version)["default"];
                }
            });
            export {
                aaa,
                bbb,
            };
            module.exports = classNames;
        `
        console.log(my.run(text));
    });
});
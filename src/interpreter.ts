export default class Interpreter {

    /**
     * match six regex
     * export default class uuu
     * export class abc
     * exports.eee =
     * exports["default"] =
     * Object.defineProperty( exports , 'version'
     * export {
             a,
             b,
       }
       module.exports = classNames;
     */
    private static importRegex = new RegExp(`
        export\\s+(default\\s+){0,1}(?:const|let|var|function|class)\\s+([\\w]+)
        |exports\\.([\\w]+)\\s*=
        |exports\\[\\"([\\w]+)\\"\\]\\s*=
        |Object.defineProperty\\(\\s*exports\\s*,\\s*[\\'|\\"]([\\w]+)[\\'|\\"]
        |module.exports\\s*=\\s*([\\w]+)
        |export\\s+(\\{[^\\}]+\\})
    `.replace(/\s*/g, ''), 'g');

    private static importBlockRegex = /[\w]+/g;

    public run(text :string) {
        return this.extractModuleFromFile(text);
    }

    private extractModuleFromFile(text: string) {
        const result = [];
        let res;
        let i = 0;
        while ((res = Interpreter.importRegex.exec(text)) != null) {
            for (i = 2; i < 7; i+=1) {
                if (res[i] != null) {
                    // TODO: replace default to filename@@defalut，if filename is index，replace to dirname-defalut
                    result.push(res[i]);
                    break;
                }
            }
            if (res[7] != null) {
                result.push(...this.extrachModuleFromExportBlock(res[7]))
            }
        }
        return result;
    }

    /**
     * {
           a,
           b,
       }
     */
    private extrachModuleFromExportBlock(block) {
        const result = [];
        let res = [];
        // TODO: filter all comment, we can use split(',') //[\s\S]*?[\n|\r\n] or /\*{1,2}[\s\S]*?\*/
        while ((res = Interpreter.importBlockRegex.exec(block)) != null) {
            result.push(res[0]);
        }
        return result;
    }
}


/**
 * TODO:
 * 1. module.exports = require('./lib/React');
 * 2. module.exports = React;
 *    var React = {
          Children: {
              map: ReactChildren.map,
              forEach: ReactChildren.forEach,
              count: ReactChildren.count,
              toArray: ReactChildren.toArray,
              only: onlyChild
          },
          createElement: createElement,
          cloneElement: cloneElement,
          isValidElement: ReactElement.isValidElement,
      }
    3. ts文件，包括@types、index.d.ts
 */
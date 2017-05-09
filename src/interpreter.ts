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

    private static unWantedName = ['__esModule', 'function', 'exports', 'require'];

    public run(text :string, isIndex: boolean, moduleName :string, fileName: string) {
        return this.extractModuleFromFile(text, isIndex, moduleName, fileName);
    }

    private extractModuleFromFile(text: string, isIndex: boolean, moduleName :string, fileName: string) {
        const nameList = [];
        const resultList = [];
        let res;
        let i = 0;
        while ((res = Interpreter.importRegex.exec(text)) != null) {
            for (i = 2; i < 7; i+=1) {
                if (res[i] != null) {
                    if (!this.isUnwantedName(res[i]) && !nameList.includes(res[i])) {
                        nameList.push(res[i]);
                    }
                    break;
                }
            }
            if (res[7] != null) {
                nameList.push(...this.extrachModuleFromExportBlock(res[7]))
            }
        }
        nameList.forEach((item) => {
            const o = {}
            if (item === 'default') {
                o['defalut'] = true;
                o['name'] = isIndex ? moduleName: fileName;
            } else {
                o['defalut'] = false;
                o['name'] = item;
            }
            resultList.push(o)
        });
        return resultList;
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

    isUnwantedName(name) {
        return Interpreter.unWantedName.includes(name);
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
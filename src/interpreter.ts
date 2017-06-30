import strip from 'parse-comment-es6';
import findExports from "./findExports";

export interface ModuleItem {
    name: string;
    default: boolean;
}

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
       exports.default = _parseImport2.default;
     */
    private static importRegex = new RegExp(`
        exports.default\\s*=\\s*(\\w+).default
        |module.exports\\s*=\\s*(\\w+)
        |exports\\[[\\'\\"]default[\\'\\"]\\]\\s*=\\s*(\\w+)
        |export\\s+(default\\s+){0,1}(?:(?:const|let|var|interface|function|function\\*|class)\\s+){0,1}([\\w]+)
        |exports\\.([\\w]+)\\s*=
        |exports\\[\\"([\\w]+)\\"\\]\\s*=
        |Object.defineProperty\\(\\s*exports\\s*,\\s*[\\'|\\"]([\\w]+)[\\'|\\"]
        |export\\s+(?:default\\s+){0,1}(\\{[^\\}]+\\})
    `.replace(/\s*/g, ''), 'g');

    private static importBlockRegex = /[\w]+/g;

    private static unWantedName = ['__esModule', 'function', 'exports', 'require', 'default'];

    public run(text :string, isIndex: boolean, moduleName :string, fileName: string) {
        return this.extractModuleFromFile(strip(text).text, isIndex, moduleName, fileName);
    }

    private addDefaultName(name: string, moduleName: string, resultList: Array<ModuleItem>) {
        // support export['default'] = _xxxx2 or _xxxx
        const mt = name.match(/(?:^_(\w+)2)|(?:^_(\w+))/)
        let defaultName = name;
        if (mt != null) {
            defaultName =  mt[1] != null ? mt[1] : mt[2];
        }
        if (!this.isUnwantedName(defaultName)) {
            resultList.push({
                default: true,
                name: defaultName,
            })
        }
        return name;
    }

    private extractModuleFromFile(text: string, isIndex: boolean, moduleName :string, fileName: string) {
        const nameList: Array<string> = [];
        const resultList : Array<ModuleItem> = [];
        let res;
        let i = 0;
        while ((res = Interpreter.importRegex.exec(text)) != null) {
            if (res[1] != null) {
                this.addDefaultName(res[1], moduleName, resultList);
                continue;
            }
            if (res[2] != null) {
                this.addDefaultName(res[2], moduleName, resultList);
                continue;
            }
            if (res[3] != null) {
                this.addDefaultName(res[3], moduleName, resultList);
                continue;
            }
            if (res[4] != null) {
                resultList.push({
                    default: true,
                    name: res[5],
                })
                continue;
            }
            for (i = 5; i < 9; i+=1) {
                if (res[i] != null) {
                    if (!this.isUnwantedName(res[i]) && !nameList.includes(res[i])) {
                        nameList.push(res[i]);
                    }
                    break;
                }
            }
            if (res[9] != null) {
                nameList.push(...this.extrachModuleFromExportBlock(res[9]))
            }
        }
        nameList.forEach((item) => {
            if (item === 'default') {
                resultList.push({
                    default: true,
                    name: isIndex ? moduleName: fileName,
                })
            } else {
                resultList.push({
                    default: false,
                    name: item,
                })
            }
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
        while ((res = Interpreter.importBlockRegex.exec(block)) != null) {
            result.push(res[0]);
        }
        return result;
    }

    public isUnwantedName(name) :boolean{
        return Interpreter.unWantedName.includes(name);
    }

    public runMainFile(data, moduleName, mainFilePath) {
        // { named: [], hasDefault: true }
        const resultList : Array<ModuleItem> = [];
        try {
            const result = findExports(data, mainFilePath);
            if (result.hasDefault) {
                resultList.push({
                    default: true,
                    name: result.defaultName != null ?  result.defaultName : moduleName,
                })
            }
            result.named.forEach(name => {
                if (!this.isUnwantedName(name) && name !== undefined) {
                    resultList.push({
                        default: false,
                        name: name,
                    })
                }
            });
            return resultList;
        } catch (error) {
            return [];
        }
    }
}


/**
 * TODO:
    3. ts文件，包括@types、index.d.ts
 */

// TODO: export default xxxx(), 如果后面跟着括号，说明是调用函数，此时默认名称可以使用文件名

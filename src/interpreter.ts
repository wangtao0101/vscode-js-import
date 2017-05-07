export class Interpreter {

    /**
     * match five regex
     * export class abc
     * exports.eee =
     * exports["default"] =
     * Object.defineProperty( exports , 'version'
     * export {
             a,
             b,
         }
     */
    private static importRegex = new RegExp(`
        export\\s(?:const|let|var|function|class)\\s+([\\w]+)
        |exports\\.([\\w]+)\\s*=
        |exports\\[\\"([\\w]+)\\"\\]\\s*=
        |Object.defineProperty\\(\\s*exports\\s*,\\s*[\\'|\\"]([\\w]+)[\\'|\\"]
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
            for (i = 1; i < 5; i+=1) {
                if (res[i] != null) {
                    // TODO: 把defalut替換成文件名
                    result.push(res[i]);
                    break;
                }
            }
            if (res[5] != null) {
                result.push(...this.extrachModuleFromExportBlock(res[5]))
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
        while ((res = Interpreter.importBlockRegex.exec(block)) != null) {
            result.push(res[0]);
        }
        return result;
    }
}
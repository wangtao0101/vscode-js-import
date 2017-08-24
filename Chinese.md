# vscode-js-import
[![Marketplace Version](http://vsmarketplacebadge.apphb.com/version/wangtao0101.vscode-js-import.svg)](https://marketplace.visualstudio.com/items?itemName=wangtao0101.vscode-js-import)
[![Installs](http://vsmarketplacebadge.apphb.com/installs/wangtao0101.vscode-js-import.svg)](https://marketplace.visualstudio.com/items?itemName=wangtao0101.vscode-js-import)
[![Build Status](https://img.shields.io/travis/wangtao0101/vscode-js-import.svg?style=flat)](https://travis-ci.org/wangtao0101/vscode-js-import)
[![Marketplace Version](http://vsmarketplacebadge.apphb.com/trending-monthly/wangtao0101.vscode-js-import.svg)](https://marketplace.visualstudio.com/items?itemName=wangtao0101.vscode-js-import)

智能快速的插入import语句的vscode插件，支持配置插入import的位置和插入到已有的import语句中。

# 介绍
![GitHub Logo](https://github.com/wangtao0101/vscode-js-import/blob/master/img/newimport.gif?raw=true)

# 快捷键
ctrl + alt + h  (mac cmd + alt + h)

在需要导入的单词上按下快捷键，然后选中需要导入的包。

# 特性
## 支持识别eslint rule(no-undef)和ts compiler的错误，并提供autofix功能

如果要开启这个功能, 你的vscode需要安装 [eslint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint)。

![GitHub Logo](https://github.com/wangtao0101/vscode-js-import/blob/master/img/autofix.gif?raw=true)

## 支持import语句的多行格式，支持注释
如果原来的import语句是多行格式或者超过了单行的字符限制，我们会将该import语句转成多行格式，并小心的处理注释。

下面我们添加了一个新的namedImport 'e':

![GitHub Logo](https://github.com/wangtao0101/vscode-js-import/blob/master/img/mer.png?raw=true)

注意我们处理注释的规则，我们把每个注释分配到每个单词:
1. 如果注释和defaultImport或者import在同一行，那么这个注释会被移动到'{'后面。
2. 对于namedImports有两种情况，如果注释和namedImports在上一行，那么注释仍然在上一行，如果注释和namedImports在同一行，那么注释会被移动到namedImports同行的逗号后面。
3. 如果注释和from或者moduleSpecifier在同一行，那么注释会被移动到该行的分号后面

Tips：如果我们尝试将单行语句分成多行，我们可能不知道要将注释放在哪一行，如果遇到这种情况我们会把注释都移到moduleSpecifier的分号后面。如果你使用了eslint的eslint-disable-line，你可能需要自动移动一下注释。

## 支持配置插入语句的位置
有两个可插入的位置，一个是在所有import语句的前面，一个是在所有import语句的后面（未来会支持插入排序）。

你需要知道在插入一个有注释的import语句时我们是怎么识别注释的：
```
// i am leading comment of import a from 'b';
import a from 'b';
// i am trailing comment of import a from 'b';

// i am leading comment of import a from 'b';
import a from 'b';
// i am leading comment of import c from 'd';
import c from 'd';
```
空行会区分注释到底归属于上一个import的还是后一个import。因此，如果我们想在import语句后插入一行注释，别忘了在注释后加空行。

当然，插入的时候我们会跳过@flow注释和copyright注释。

## 支持auto code completion
![GitHub Logo](https://github.com/wangtao0101/vscode-js-import/blob/master/img/codecomplete.gif?raw=true)

## 支持导入 scss, css, less, json, bmp, gif, jpe, jpeg, png 等文件, 支持 css-modules
请看配置项 js-import.plainFileSuffix and js-import.plainFileSuffixWithDefaultMember

## 支持配置像[lerna](https://github.com/lerna/lerna)风格的多个单独包的目录
如果你有一个类似下面的目录：
```
my-lerna-repo/
  package.json
  packages/
    package-1/
      abc.js
      def.js
      package.json
    package-2/
      package.json
```
你可以在settings.json中像这样配置：
```
"js-import.root": "packages"
"js-import.alias": {
    "package-1": "packages/package-1/"
    "package-2": "packages/package-2/"
}
```
如果你想导入abc.js文件中的abc，导入语句为：
```
import abc from 'package-1/abc'
```
如果目标文件和源文件在同一个包中，我们会使用相对路径。

## 支持node_modules
为了优化性能，我们只会处理在package.json中明确依赖的包，包括dependencies, devDependencies, peerDependencies, optionalDependencies，并且
我们只会导入这些包中package.json中的mainfile中的导出项。

如果你想要导入node_modules中的内容，不要忘记把需要的包添加到package.json中。另外，我们支持嵌套导入，类似 module.exports = require('./lib/React')。

我们会自动检测package.json的变化，并自动新增或者移除包。

## 一个可爱的图标，显示了插件能够检测到的可导出包的数量。
![GitHub Logo](https://github.com/wangtao0101/vscode-js-import/blob/master/img/icon.png?raw=true)

# 配置
```
//根目录，我们仅支持单个根目录（lerna风格就是把包都放在同一个根目录）
"js-import.root": "src"

// 类似于webpack的resolve.alias或者typescript的compilerOptions.paths, 不支持嵌套
"js-import.alias": {
    "helpalias": "src/package/"
}

//Glob for files to watch and scan, e.g ./src/** ./src/app/**/*.js. Defaults to **/*.{jsx,js,ts,tsx}
"js-import.filesToScan": "**/*.{jsx,js,tsx,ts}"

//配置文件格式导入的后缀格式，默认为css、less、sass
//导入这类文件的语句仅会有import和model-name，例如：'import 'xxx.less'。
//如果你使用了css modules，你可以将css、less、sass从这里移除。
"js-import.plainFileSuffix": "css,less,sass"

//配置文件格式导入的后缀格式，默认为json,bmp,gif,jpe,jpeg,png
//导入这类文件的语句会有defaultImport，例如：'import json form 'xxx.json'。
//如果你使用了css modules，你可以将css、less、sass添加到这里。
"js-import.plainFileSuffixWithDefaultMember": "json,bmp,gif,jpe,jpeg,png"

//the insert position of new import statement, first means first of all imports, last means last of all imports, soon we will suport sort
"js-import.insertPosition": "last"

//option for comma-dangle to generate import statement, like esline rule imports of comma-dangle, there are four options :　never, always, always-multiline, only-multiline
"js-import.commaDangleImport": "never"

//whether to enable codeCompletion
"js-import.codeCompletion": true

//whether to use singlequote or use doublequote
"js-import.quote": "singlequote"

//whether to autofix import when you select completion item, you can set it false to avoid mistaken import,
//then we will only provide code completion and you can use shutcut or autofix to import identifier
"js-import.codeCompletionAction": false

//max-line length like eslint rule max-line, the -1 will disable the rule,
//if import statement exceed maxLen, the statement will be split into multiple lines.
"js-import.maxLen": 100
```

# TODO
Currently in beta, there are a lot of work to do;
- [x] full suport in node_modules, only extract export form main file and support module.exports = require('./lib/React')
- [x] full support import statement, such as 'feedline' in import statement
- [x] option for insert position (ability to skip flow, Copyright, Lisence comment in top of file)
- [ ] sort import statement by eslint rule, deal with comment
- [x] support autocomplete
- [x] support auto fix by eslint rule
- [x] support option for max-line like eslint rule max-line, auto split statement to mutilines
- [ ] support shortcut goto module under cursor, spec react conpoment
- [x] support import "module-name"
- [ ] autofix useless import statement or identifier by using eslint rule(no-unused-vars)
- [x] support import scss, css, less, json, bmp, gif, jpe, jpeg, png file
- [ ] support commonjs, considering require nodejs built-in modules
- [ ] full support typescript, using typescript parse
- [ ] full support flow, export type and import type
- [ ] support action for remove unused import identifier using eslint or tslint

# Export RegExp
```
exports.default\\s*=\\s*(\\w+).default
module.exports\\s*=\\s*(\\w+)
exports\\[[\\'\\"]default[\\'\\"]\\]\\s*=\\s*(\\w+)
export\\s+(default\\s+){0,1}(?:(?:const|let|var|function|function\\*|class)\\s+){0,1}([\\w]+)
exports\\.([\\w]+)\\s*=
exports\\[\\"([\\w]+)\\"\\]\\s*=
Object.defineProperty\\(\\s*exports\\s*,\\s*[\\'|\\"]([\\w]+)[\\'|\\"]
export\\s+(?:default\\s+){0,1}(\\{[^\\}]+\\})
```

## Contributing

Pull requests and stars are always welcome. For bugs and feature requests, [please create an issue](https://github.com/wangtao0101/vscode-js-import/issues).

# Thanks
some code from [import-js](https://github.com/Galooshi/import-js)

# [CHANGELOG](https://github.com/wangtao0101/vscode-js-import/blob/master/CHANGELOG.md)

# vscode-js-import
[![Marketplace Version](http://vsmarketplacebadge.apphb.com/version/wangtao0101.vscode-js-import.svg)](https://marketplace.visualstudio.com/items?itemName=wangtao0101.vscode-js-import)
[![Installs](http://vsmarketplacebadge.apphb.com/installs/wangtao0101.vscode-js-import.svg)](https://marketplace.visualstudio.com/items?itemName=wangtao0101.vscode-js-import)
[![Build Status](https://img.shields.io/travis/wangtao0101/vscode-js-import.svg?style=flat)](https://travis-ci.org/wangtao0101/vscode-js-import)

Intelligent and fast import extension for js in vscode, support both TypeScript and JavaScript !!!

# Introduce
![GitHub Logo](https://github.com/wangtao0101/vscode-js-import/blob/master/img/newimport.gif?raw=true)

# Shortcuts
ctrl + alt + j  (mac cmd + alt + j)

Move cursor into target word and enter shortcuts, then select the match import.

# Feature
## Support autofix by using eslint rule(no-undef) or ts compiler error

To enable the feature, you should install enable [eslint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint) in vscode or enable ts compiler.

![GitHub Logo](https://github.com/wangtao0101/vscode-js-import/blob/master/img/autofix.gif?raw=true)

## Support import in multiple line and support comment in any where
If origin import statement occupies multiple lines(import must have namedImports, it is not necessary to split statement when there is no namedImports), we will turn into multiple line mode and carefully handle comments.

Here we add a new namedImport 'e':

![GitHub Logo](https://github.com/wangtao0101/vscode-js-import/blob/master/img/mer.png?raw=true)

We split comments into every identifier:
1. Comments in the same line with defaultImport or 'import' word will be moved after '{'.
2. There are two kinds of comment related to namedImports, comments in previous line or in the same line of namedImports, comments in previous will be in previous also, and comments in the same line will be moved after ','
3. Comments in the same line with 'from' word or moduleSpecifier will be moved after ';'

## Suport insert position option
There are two positions we can insert new statement, before all import statements or after all import statements. (soon we can support sort option)

You should know how we deal with comments.
```
// i am leading comment of import a from 'b';
import a from 'b';
// i ame trailing comment of import a from 'b';

// i am leading comment of import a from 'b';
import a from 'b';
// i ame leading comment of import c from 'd';
import c from 'd';
```
So, if you want to comment after import in a new line, you should not forget to add a empty line after comment.

Also, we can skip @flow or copyright comment.

## Support auto code completion
![GitHub Logo](https://github.com/wangtao0101/vscode-js-import/blob/master/img/codecomplete.gif?raw=true)

## node_modules support

We only process module form dependencies, devDependencies, peerDependencies, optionalDependencies in package.json,
and only extract import from mainfile in module's package.json.

If you want to import module using vscode-js-import,
you should add the module into package.json. Besides, we support export style like module.exports = require('./lib/React');

We will watch the change of package.json, and auto add and remove module.

## A cute icon shows that how many export statements in your workspace.
![GitHub Logo](https://github.com/wangtao0101/vscode-js-import/blob/master/img/icon.png?raw=true)

# Setting
```
//the source dir, currently we only support single root
"js-import.root": "src"

//module alias like webpack alias, not support nested alias path, e.g { util: 'src/util/' }
"js-import.alias": {
    "helpalias": "src/package/"
}

//Glob for files to watch and scan, e.g ./src/** ./src/app/**/*.js. Defaults to **/*.{jsx,js,ts}
"js-import.filesToScan": "**/*.{jsx,js,ts}"

//the insert position of new import statement, first means first of all imports, last means last of all imports, soon we will suport sort
"js-import.insertPosition": "last"

//option for comma-dangle to generate import statement, like esline rule imports of comma-dangle, there are four options :　never, always, always-multiline, only-multiline
"js-import.commaDangleImport": "never"

//whether to enable codeCompletion
"js-import.codeCompletion": true

//whether to use singlequote or use doublequote
"js-import.quote": "singlequote"
```

# TODO
Currently in beta, there are a lot of work to do;
- [x] full suport in node_modules, only extract export form main file and support module.exports = require('./lib/React')
- [x] full support import statement, such as 'feedline' in import statement
- [x] option for insert position (ability to skip flow, Copyright, Lisence comment in top of file)
- [ ] sort import statement by eslint rule, deal with comment
- [x] support autocomplete
- [x] support auto fix by eslint rule
- [ ] support option for max-line like eslint rule max-line, auto split statement to mutilines
- [ ] support shortcut goto module under cursor, spec react conpoment
- [x] support import "module-name"
- [ ] autofix useless import statement or identifier by using eslint rule(no-unused-vars)
- [ ] support import scss, css, less, json, bmp, gif, jpe, jpeg, png file
- [ ] support commonjs, considering require nodejs built-in modules

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

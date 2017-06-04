# vscode-js-import
[![Marketplace Version](http://vsmarketplacebadge.apphb.com/version/wangtao0101.vscode-js-import.svg)](https://marketplace.visualstudio.com/items?itemName=wangtao0101.vscode-js-import)
[![Installs](http://vsmarketplacebadge.apphb.com/installs/wangtao0101.vscode-js-import.svg)](https://marketplace.visualstudio.com/items?itemName=wangtao0101.vscode-js-import)
[![Build Status](https://img.shields.io/travis/wangtao0101/vscode-js-import.svg?style=flat)](https://travis-ci.org/wangtao0101/vscode-js-import)

intelligent and fast import extension for js in vscode

# Introduce
![GitHub Logo](https://raw.githubusercontent.com/wangtao0101/vscode-js-import/master/img/import.gif)

# Shortcuts
ctrl + alt + j  (mac cmd + alt + j)

# Feature
## Support import in multiple line
If origin import statement occupies multiple lines(import must have namedImports, it is not necessary to split statement when there is no namedImports), we will turn into multiple line mode and carefully handle comments.
![merge](https://raw.githubusercontent.com/wangtao0101/vscode-js-import/master/img/merge.png)

We split comments into every identifier:
1. Comments in the same line with defaultImport or 'import' word will be moved after '{'.
2. There are two kinds of comment related to namedImports, comments in previous line or in the same line of namedImports, comments in previous will be in previsou also, and comments in the same line will be moved after ','
3. Comments in the same line with 'from' word or moduleSpecifier will be moved after ';'

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
"js-import.insertPosition" : "last"
```

# TODO
Currently in beta, there are a lot of work to do;
- [ ] full suport in node_modules, currently only extract export form main file
- [ ] full support import statement, such as 'feedline' in import statement
- [ ] option for insert position (ability to skip flow, Copyright, Lisence comment in top of file), currently we just insert statement into fisrtline.
- [ ] sort import statement by eslint rule, deal with comment
- [ ] support autocomplete
- [ ] support auto fix by eslint rule
- [ ] support import statement syntax check
- [ ] support option for max-line like eslint rule max-line, auto split statement to mutilines

# Export RegExp
```
export (default) (const|let|var|function|function*|class) abc;
export default abc;
exports.eee = eee
exports["default"] = abc
Object.defineProperty( exports , 'version', ...
export {
    a,
    b,
}
module.exports = classNames;
exports.default = _parseImport2.default; //webpack export default style
```

# [CHANGELOG](https://github.com/wangtao0101/vscode-js-import/blob/master/CHANGELOG.md)

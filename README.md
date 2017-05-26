# vscode-js-import
[![Marketplace Version](http://vsmarketplacebadge.apphb.com/version/wangtao0101.vscode-js-import.svg)](https://marketplace.visualstudio.com/items?itemName=wangtao0101.vscode-js-import)
[![Installs](http://vsmarketplacebadge.apphb.com/installs/wangtao0101.vscode-js-import.svg)](https://marketplace.visualstudio.com/items?itemName=wangtao0101.vscode-js-import)

intelligent and fast import extension for js in vscode

# Introduce
![GitHub Logo](https://raw.githubusercontent.com/wangtao0101/vscode-js-import/master/img/import.gif)

# Shortcuts
ctrl + alt + j  (mac cmd + alt + j)

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

# Export regex
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
```

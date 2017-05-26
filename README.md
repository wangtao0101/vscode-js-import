# vscode-js-import
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

//Glob for files to watch and scan, e.g ./src/** ./src/app/**/*.js. Defaults to **/*.{jsx,js}
"js-import.filesToScan": "**/*.{jsx,js}"
```

# TODO
Currently in beta, there are a lot of work to do;
- [ ] full suport in node_modules, currently only extract import form main file
- [ ] full support import statement, such as 'feedline' in import statement
- [ ] option for insert position (ability to skip flow, Copyright, Lisence comment in top of file), currently we just insert statement into fisrtline.
- [ ] sort import statement by eslint rule, deal with comment
- [ ] support autocomplete
- [ ] support auto fix by eslint rule
- [ ] support import statement syntax check
- [ ] support option for max-line like eslint rule max-line, auto split statement to mutilines

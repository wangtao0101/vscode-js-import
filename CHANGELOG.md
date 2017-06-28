# Change Log

## [0.10.1] - 2017-
- fix bug: add line feed after insert new import statement

## [0.10.0] - 2017-06-26
- refact code, prepare for sort import
- make code testable and add more test
- add option maxLen

## [0.9.4] - 2017-06-20
- fix relative path bug on window

## [0.9.3] - 2017-06-13
- filter current file export
- add option codeCompletionAction

## [0.9.2] - 2017-06-12
- filter import name 'default'
- support export interface

## [0.9.1] - 2017-06-08
- delete word if the word is in a single line after import
- support recognize import 'module-name'

## [0.9.0] - 2017-06-07
- fix bug, moduleSpecifier support _ and -
- full suport in node_modules, only extract export form main file and support module.exports = require('./lib/React')
- watch change of package.json, auto remove and add module

## [0.8.0] - 2017-06-06
- add feature codeCompletion
- add codeCompletion option
- add quote option

## [0.7.0] - 2017-06-05
- fix doublequote bug
- support autofix

## [0.6.2] - 2017-06-05
- support commaDangleImport option

## [0.6.1] - 2017-06-04
- support insert position option
- support multiple line import statement

## [0.5.1] - 2017-06-01
- support webpack export style like : exports.default = _parseImport2.default
- support partial matching of module name and value

## [0.4.0] - 2017-05-26
- support ts file in source code
- fix option filesToScan inactive bug
- add error msg when attempt to import mutiple default variable

## [0.3.1] - 2017-05-26
- support as in import statement (currently not support line feed)
- clean up import although is already import

## [0.2.1] - 2017-05-26
- Initial release

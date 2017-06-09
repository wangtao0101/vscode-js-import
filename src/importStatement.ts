
export default class ImportStatement {
    importedDefaultBinding: string;
    namedImports: string;
    nameSpaceImport: string;
    loc: any;
    range: any;
    raw: string;
    middleComments: any;
    leadComments: any;
    trailingComments: any;
    moduleSpecifier: string;
    error: number;

    constructor(
        importedDefaultBinding,
        namedImports,
        nameSpaceImport,
        loc,
        range,
        raw,
        middleComments,
        leadComments,
        trailingComments,
        moduleSpecifier,
        error,
    ) {
        this.importedDefaultBinding = importedDefaultBinding;
        this.namedImports = namedImports;
        this.nameSpaceImport = nameSpaceImport;
        this.loc = loc;
        this.range = range;
        this.raw = raw;
        this.middleComments = middleComments;
        this.leadComments = leadComments;
        this.trailingComments = trailingComments;
        this.moduleSpecifier = moduleSpecifier;
        this.error = error;
    }

    toImportString() {
        // TODO:
    }

    toSingleLineString() {
        // TODO:
    }

    toMultipleLineString() {
        // TODO:
    }

    merge(importStatement: ImportStatement) {
        // TODO:
    }
}

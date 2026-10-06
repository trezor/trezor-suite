import ts from 'typescript';

const hasJsDocTag = (declaration: ts.Statement, tag: string) => {
    const { text } = declaration.getSourceFile();
    const comments = ts.getLeadingCommentRanges(text, declaration.getFullStart()) ?? [];

    // Fast ESLint parsing omits JSDoc metadata, so inspect only the declaration's leading
    // JSDoc comments. A marker in a string, another declaration, or ordinary comment is not enough.
    return comments.some(comment => {
        const value = text.slice(comment.pos, comment.end);

        if (!value.startsWith('/**')) {
            return false;
        }

        const tags = value.slice(3, -2).matchAll(/(?:^|\r?\n)\s*\*?\s*@(\S+)/gu);

        return Array.from(tags).some(match => match[1] === tag);
    });
};

const declaresSymbol = (statement: ts.Statement, name: string) => {
    if (ts.isVariableStatement(statement)) {
        // Variable JSDoc belongs to the whole statement, including each named declaration.
        return statement.declarationList.declarations.some(
            declaration => ts.isIdentifier(declaration.name) && declaration.name.text === name,
        );
    }

    return (
        (ts.isFunctionDeclaration(statement) ||
            ts.isClassDeclaration(statement) ||
            ts.isInterfaceDeclaration(statement) ||
            ts.isTypeAliasDeclaration(statement) ||
            ts.isEnumDeclaration(statement)) &&
        statement.name?.text === name
    );
};

/**
 * Reads a JSDoc tag (without the leading @) on a named top-level declaration.
 * Follows named imports/re-exports without creating a TypeScript program or type checker.
 */
export const createHasSymbolTag = (sourceFile: ts.SourceFile) => {
    // Cache only for this linted file so editor runs cannot reuse stale tags.
    const sourceFiles = new Map<string, ts.SourceFile>([[sourceFile.fileName, sourceFile]]);
    const compilerOptions: ts.CompilerOptions = {
        moduleResolution: ts.ModuleResolutionKind.Bundler,
    };
    const resolutionCache = ts.createModuleResolutionCache(
        ts.sys.getCurrentDirectory(),
        path => path,
    );

    const readImportedFile = (specifier: string, containingFile: string) => {
        // Module resolution only reads paths/package metadata; it does not load a project or
        // follow the imported file's dependencies. Never execute an imported module.
        const resolved = ts.resolveModuleName(
            specifier,
            containingFile,
            compilerOptions,
            ts.sys,
            resolutionCache,
        ).resolvedModule;

        if (resolved === undefined) {
            return undefined;
        }

        const cached = sourceFiles.get(resolved.resolvedFileName);

        if (cached !== undefined) {
            return cached;
        }

        const text = ts.sys.readFile(resolved.resolvedFileName);

        if (text === undefined) {
            return undefined;
        }

        const importedFile = ts.createSourceFile(
            resolved.resolvedFileName,
            text,
            ts.ScriptTarget.Latest,
            true,
        );
        sourceFiles.set(resolved.resolvedFileName, importedFile);

        return importedFile;
    };

    const findDeclaration = (
        file: ts.SourceFile,
        name: string,
        exported: boolean,
        visited: Set<string>,
    ): ts.Statement | null => {
        const key = `${file.fileName}:${name}:${exported}`;

        if (visited.has(key)) {
            return null;
        }

        visited.add(key);

        const followImport = (specifier: ts.Expression, importedName: string) => {
            if (!ts.isStringLiteral(specifier)) {
                return null;
            }

            const importedFile = readImportedFile(specifier.text, file.fileName);

            return importedFile === undefined
                ? null
                : findDeclaration(importedFile, importedName, true, visited);
        };

        for (const statement of file.statements) {
            if (declaresSymbol(statement, name)) {
                const modifiers = ts.canHaveModifiers(statement)
                    ? ts.getModifiers(statement)
                    : undefined;
                const isExported = modifiers?.some(
                    modifier => modifier.kind === ts.SyntaxKind.ExportKeyword,
                );

                const isDefault = modifiers?.some(
                    modifier => modifier.kind === ts.SyntaxKind.DefaultKeyword,
                );

                if (exported && (!isExported || isDefault)) {
                    continue;
                }

                return statement;
            }

            if (!exported && ts.isImportDeclaration(statement)) {
                const bindings = statement.importClause?.namedBindings;
                const imported =
                    bindings !== undefined && ts.isNamedImports(bindings)
                        ? bindings.elements.find(element => element.name.text === name)
                        : undefined;

                if (imported !== undefined) {
                    return followImport(
                        statement.moduleSpecifier,
                        imported.propertyName?.text ?? imported.name.text,
                    );
                }
            }

            if (
                exported &&
                ts.isExportDeclaration(statement) &&
                statement.exportClause !== undefined &&
                ts.isNamedExports(statement.exportClause)
            ) {
                const exportSpecifier = statement.exportClause.elements.find(
                    element => element.name.text === name,
                );

                if (exportSpecifier !== undefined) {
                    const originalName =
                        exportSpecifier.propertyName?.text ?? exportSpecifier.name.text;

                    return statement.moduleSpecifier === undefined
                        ? findDeclaration(file, originalName, false, visited)
                        : followImport(statement.moduleSpecifier, originalName);
                }
            }
        }

        return null;
    };

    return (name: string, tag: string) => {
        const declaration = findDeclaration(sourceFile, name, false, new Set());

        return declaration !== null && hasJsDocTag(declaration, tag);
    };
};

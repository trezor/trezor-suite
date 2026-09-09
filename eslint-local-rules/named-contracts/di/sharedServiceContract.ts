import ts from 'typescript';

const hasServiceContractTag = (declaration: ts.TypeAliasDeclaration | ts.InterfaceDeclaration) => {
    const { text } = declaration.getSourceFile();
    const comments = ts.getLeadingCommentRanges(text, declaration.getFullStart()) ?? [];

    // Fast ESLint parsing omits JSDoc metadata, so inspect only the declaration's leading
    // JSDoc comments. A marker in a string, another declaration, or ordinary comment is not enough.
    return comments.some(comment => {
        const value = text.slice(comment.pos, comment.end);

        return (
            value.startsWith('/**') &&
            /(?:^|\r?\n)\s*\*?\s*@serviceContract(?:\s|$)/u.test(value.slice(3, -2))
        );
    });
};

/** Reads explicit contract markers without creating a TypeScript program or type checker. */
export const createIsSharedServiceContract = (sourceFile: ts.SourceFile) => {
    // Cache only for this linted file so editor runs cannot reuse stale contract markers.
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

    const hasMarker = (
        file: ts.SourceFile,
        name: string,
        exported: boolean,
        visited: Set<string>,
    ): boolean => {
        const key = `${file.fileName}:${name}:${exported}`;

        if (visited.has(key)) {
            return false;
        }

        visited.add(key);

        const followImport = (specifier: ts.Expression, importedName: string) => {
            if (!ts.isStringLiteral(specifier)) {
                return false;
            }

            const importedFile = readImportedFile(specifier.text, file.fileName);

            return (
                importedFile !== undefined && hasMarker(importedFile, importedName, true, visited)
            );
        };

        for (const statement of file.statements) {
            if (
                (ts.isTypeAliasDeclaration(statement) || ts.isInterfaceDeclaration(statement)) &&
                statement.name.text === name
            ) {
                const isExported = statement.modifiers?.some(
                    modifier => modifier.kind === ts.SyntaxKind.ExportKeyword,
                );

                if (exported && !isExported) {
                    continue;
                }

                return hasServiceContractTag(statement);
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
                        ? hasMarker(file, originalName, false, visited)
                        : followImport(statement.moduleSpecifier, originalName);
                }
            }
        }

        return false;
    };

    return (name: string) => hasMarker(sourceFile, name, false, new Set());
};

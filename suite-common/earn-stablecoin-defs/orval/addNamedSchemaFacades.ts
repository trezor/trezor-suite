// eslint-disable-next-line import/no-extraneous-dependencies -- Used only by the Orval generator.
import ts from 'typescript';

type SourceEdit = {
    start: number;
    end: number;
    replacement: string;
};

const isExported = (statement: ts.Statement) =>
    ts.canHaveModifiers(statement) &&
    ts.getModifiers(statement)?.some(modifier => modifier.kind === ts.SyntaxKind.ExportKeyword);

const lowerCaseFirstCharacter = (value: string) =>
    value.replace(/^[A-Z]/, character => character.toLowerCase());

/**
 * Gives every generated Zod value a small named public type. Keeping the concrete Zod type private
 * prevents endpoint declaration files from structurally expanding it.
 */
export function addNamedSchemaFacades(implementation: string): string {
    const sourceFile = ts.createSourceFile(
        'orval-zod-client.ts',
        implementation,
        ts.ScriptTarget.Latest,
        true,
        ts.ScriptKind.TS,
    );
    const exportedTypeAliases = new Map(
        sourceFile.statements
            .filter(ts.isTypeAliasDeclaration)
            .filter(isExported)
            .map(statement => [statement.name.text, statement]),
    );
    const edits: SourceEdit[] = [];

    for (const statement of sourceFile.statements) {
        if (
            !ts.isVariableStatement(statement) ||
            !isExported(statement) ||
            statement.declarationList.declarations.length !== 1
        ) {
            continue;
        }

        const declaration = statement.declarationList.declarations[0];

        if (
            !declaration ||
            !ts.isIdentifier(declaration.name) ||
            !declaration.initializer ||
            !/^[A-Z]/.test(declaration.name.text)
        ) {
            continue;
        }

        const schemaName = declaration.name.text;
        const implementationName = `${lowerCaseFirstCharacter(schemaName)}Implementation`;
        const inputType = exportedTypeAliases.get(schemaName);
        const outputType = exportedTypeAliases.get(`${schemaName}Output`);
        const initializer = declaration.initializer.getText(sourceFile);

        edits.push({
            start: statement.getStart(sourceFile),
            end: statement.getEnd(),
            replacement: [
                `const ${implementationName} = ${initializer};`,
                '',
                `export type ${schemaName} = zod.input<typeof ${implementationName}>;`,
                `export type ${schemaName}Output = zod.output<typeof ${implementationName}>;`,
                '',
                `export interface ${schemaName}Schema`,
                `    extends zod.ZodType<${schemaName}Output, ${schemaName}> {}`,
                '',
                `export const ${schemaName}: ${schemaName}Schema = ${implementationName};`,
            ].join('\n'),
        });

        for (const typeAlias of [inputType, outputType]) {
            if (typeAlias) {
                edits.push({
                    start: typeAlias.getStart(sourceFile),
                    end: typeAlias.getEnd(),
                    replacement: '',
                });
            }
        }
    }

    return edits
        .sort((left, right) => right.start - left.start)
        .reduce(
            (result, edit) =>
                `${result.slice(0, edit.start)}${edit.replacement}${result.slice(edit.end)}`,
            implementation,
        );
}

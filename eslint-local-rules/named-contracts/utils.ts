import type { Rule } from 'eslint';
import ts from 'typescript';

import {
    type TypeScriptNodeReporter,
    createTypeScriptNodeReporter,
    getTypeScriptParserServices,
} from '../utils';

export type NamedContractRuleContext = {
    createAdjacentDeclarationSwapFix: (
        firstDeclaration: ts.Statement,
        secondDeclaration: ts.Statement,
    ) => Rule.ReportFixer | undefined;
    localTypeAliases: Map<string, ts.TypeAliasDeclaration>;
    report: TypeScriptNodeReporter;
    sourceFile: ts.SourceFile;
    statements: ts.NodeArray<ts.Statement>;
    validateContractBlockSpacing: (
        firstStatementIndex: number,
        consumerStatementIndex: number,
        consumerName: string,
    ) => void;
};

export const createNamedContractRuleListener = (
    context: Rule.RuleContext,
    validate: (contractContext: NamedContractRuleContext) => void,
): Rule.RuleListener => {
    const parserServices = getTypeScriptParserServices(context);

    if (parserServices === undefined) {
        return {};
    }

    return {
        'Program:exit': programNode => {
            const sourceFile = parserServices.getTypeScriptNode(programNode as Rule.Node);

            if (sourceFile === undefined || !ts.isSourceFile(sourceFile)) {
                return;
            }

            const { statements } = sourceFile;
            const localTypeAliases = new Map(
                statements
                    .filter(ts.isTypeAliasDeclaration)
                    .map(declaration => [declaration.name.text, declaration] as const),
            );

            const report = createTypeScriptNodeReporter(context, parserServices);

            const createAdjacentDeclarationSwapFix: NamedContractRuleContext['createAdjacentDeclarationSwapFix'] =
                (firstDeclaration, secondDeclaration) => {
                    const firstStatementIndex = statements.indexOf(firstDeclaration);
                    const secondStatementIndex = statements.indexOf(secondDeclaration);

                    if (secondStatementIndex !== firstStatementIndex + 1) {
                        return undefined;
                    }

                    const previousStatement = statements[firstStatementIndex - 1];
                    const nextStatement = statements[secondStatementIndex + 1];
                    const firstStart = firstDeclaration.getStart(sourceFile);
                    const secondStart = secondDeclaration.getStart(sourceFile);
                    const leadingTrivia = sourceFile.text.slice(
                        previousStatement?.end ?? 0,
                        firstStart,
                    );
                    const betweenDeclarations = sourceFile.text.slice(
                        firstDeclaration.end,
                        secondStart,
                    );
                    const trailingTrivia = sourceFile.text.slice(
                        secondDeclaration.end,
                        nextStatement?.getStart(sourceFile) ?? sourceFile.end,
                    );
                    const containsComment = (text: string) => /\/\/|\/\*/u.test(text);

                    // A comment in the surrounding whitespace may describe one declaration.
                    // Moving code without knowing which declaration owns it could change its meaning.
                    if (
                        containsComment(leadingTrivia) ||
                        containsComment(betweenDeclarations) ||
                        containsComment(trailingTrivia)
                    ) {
                        return undefined;
                    }

                    const firstText = sourceFile.text.slice(firstStart, firstDeclaration.end);
                    const secondText = sourceFile.text.slice(secondStart, secondDeclaration.end);

                    return fixer =>
                        fixer.replaceTextRange(
                            [firstStart, secondDeclaration.end],
                            `${secondText}${betweenDeclarations}${firstText}`,
                        );
                };

            const validateContractBlockSpacing: NamedContractRuleContext['validateContractBlockSpacing'] =
                (firstStatementIndex, consumerStatementIndex, consumerName) => {
                    // Include the declaration immediately before the contracts so the block is
                    // separated on both sides, not only between its own declarations and consumer.
                    const spacingBlockStartIndex = Math.max(firstStatementIndex - 1, 0);
                    const contractBlock = statements.slice(
                        spacingBlockStartIndex,
                        consumerStatementIndex + 1,
                    );

                    for (let index = 1; index < contractBlock.length; index += 1) {
                        const previousStatement = contractBlock[index - 1];
                        const nextStatement = contractBlock[index];

                        if (previousStatement === undefined || nextStatement === undefined) {
                            continue;
                        }

                        const textBetweenStatements = sourceFile.text.slice(
                            previousStatement.end,
                            nextStatement.getStart(sourceFile),
                        );

                        if (/\r?\n[\t ]*\r?\n/u.test(textBetweenStatements)) {
                            continue;
                        }

                        const previousName =
                            (ts.isTypeAliasDeclaration(previousStatement) ||
                                ts.isInterfaceDeclaration(previousStatement)) &&
                            previousStatement.name.text;
                        const nextName =
                            (ts.isTypeAliasDeclaration(nextStatement) ||
                                ts.isInterfaceDeclaration(nextStatement)) &&
                            nextStatement.name.text;
                        report(
                            nextStatement,
                            'contractMustBeSeparated',
                            {
                                previousName: previousName || 'the previous declaration',
                                nextName: nextName || consumerName,
                            },
                            fixer => {
                                const firstNewline = textBetweenStatements.match(/\r?\n/u);
                                const start =
                                    firstNewline?.index === undefined
                                        ? nextStatement.getStart(sourceFile)
                                        : previousStatement.end +
                                          firstNewline.index +
                                          firstNewline[0].length;

                                return fixer.insertTextBeforeRange(
                                    [start, start],
                                    firstNewline?.[0] ?? '\n\n',
                                );
                            },
                        );
                    }
                };

            validate({
                createAdjacentDeclarationSwapFix,
                localTypeAliases,
                report,
                sourceFile,
                statements,
                validateContractBlockSpacing,
            });
        },
    };
};

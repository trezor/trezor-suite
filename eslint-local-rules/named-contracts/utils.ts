import type { Rule } from 'eslint';
import ts from 'typescript';

type TypeAwareParserServices = {
    esTreeNodeToTSNodeMap?: ReadonlyMap<Rule.Node, ts.Node>;
    program?: ts.Program;
    tsNodeToESTreeNodeMap?: ReadonlyMap<ts.Node, Rule.Node>;
};

export type NamedContractRuleContext = {
    createAdjacentDeclarationSwapFix: (
        firstDeclaration: ts.Statement,
        secondDeclaration: ts.Statement,
    ) => Rule.ReportFixer | undefined;
    localTypeAliases: Map<string, ts.TypeAliasDeclaration>;
    report: (
        node: ts.Node,
        messageId: string,
        data: Record<string, string>,
        fix?: Rule.ReportFixer,
    ) => void;
    sourceFile: ts.SourceFile;
    statements: ts.NodeArray<ts.Statement>;
    validateContractBlockSpacing: (
        firstStatementIndex: number,
        consumerStatementIndex: number,
        consumerName: string,
    ) => void;
};

export const unwrapExpression = (expression: ts.Expression): ts.Expression => {
    if (
        ts.isParenthesizedExpression(expression) ||
        ts.isAsExpression(expression) ||
        ts.isTypeAssertionExpression(expression) ||
        ts.isNonNullExpression(expression)
    ) {
        return unwrapExpression(expression.expression);
    }

    return expression;
};

export const getFunctionExpression = (expression: ts.Expression) => {
    const unwrappedExpression = unwrapExpression(expression);

    return ts.isArrowFunction(unwrappedExpression) || ts.isFunctionExpression(unwrappedExpression)
        ? unwrappedExpression
        : undefined;
};

export const getVariableFunction = (declaration: ts.VariableDeclaration) =>
    declaration.initializer === undefined
        ? undefined
        : getFunctionExpression(declaration.initializer);

export const getTypeReferenceName = (node: ts.TypeNode | undefined) =>
    node !== undefined && ts.isTypeReferenceNode(node) && ts.isIdentifier(node.typeName)
        ? node.typeName.text
        : undefined;

export const createNamedContractRuleListener = (
    context: Rule.RuleContext,
    validate: (contractContext: NamedContractRuleContext) => void,
): Rule.RuleListener => {
    const parserServices = context.sourceCode.parserServices as TypeAwareParserServices;

    if (
        parserServices.program === undefined ||
        parserServices.esTreeNodeToTSNodeMap === undefined ||
        parserServices.tsNodeToESTreeNodeMap === undefined
    ) {
        return {};
    }

    return {
        'Program:exit': programNode => {
            const sourceFile = parserServices.esTreeNodeToTSNodeMap?.get(programNode as Rule.Node);

            if (sourceFile === undefined || !ts.isSourceFile(sourceFile)) {
                return;
            }

            const { statements } = sourceFile;
            const localTypeAliases = new Map(
                statements
                    .filter(ts.isTypeAliasDeclaration)
                    .map(declaration => [declaration.name.text, declaration] as const),
            );

            const report: NamedContractRuleContext['report'] = (node, messageId, data, fix) => {
                const reportNode = parserServices.tsNodeToESTreeNodeMap?.get(node);

                if (reportNode !== undefined) {
                    context.report({ node: reportNode, messageId, data, fix });
                }
            };

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
                    const contractBlock = statements.slice(
                        firstStatementIndex,
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
                        const reportNode = parserServices.tsNodeToESTreeNodeMap?.get(nextStatement);

                        if (reportNode !== undefined) {
                            context.report({
                                node: reportNode,
                                messageId: 'contractMustBeSeparated',
                                data: {
                                    previousName: previousName || 'the previous declaration',
                                    nextName: nextName || consumerName,
                                },
                                fix: fixer => {
                                    const { line } = sourceFile.getLineAndCharacterOfPosition(
                                        nextStatement.getStart(sourceFile),
                                    );
                                    const start = sourceFile.getPositionOfLineAndCharacter(line, 0);

                                    return fixer.insertTextBeforeRange([start, start], '\n');
                                },
                            });
                        }
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

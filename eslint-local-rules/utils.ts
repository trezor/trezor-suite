import type { Rule } from 'eslint';
import ts from 'typescript';

type TypeAwareParserServices = {
    esTreeNodeToTSNodeMap?: ReadonlyMap<Rule.Node, ts.Node>;
    program?: ts.Program;
    tsNodeToESTreeNodeMap?: ReadonlyMap<ts.Node, Rule.Node>;
};

export type TypeScriptParserServices = {
    getESTreeNode: (node: ts.Node) => Rule.Node | undefined;
    getTypeScriptNode: (node: Rule.Node) => ts.Node | undefined;
    program: ts.Program;
};

export type TypeScriptNodeReporter = (
    node: ts.Node,
    messageId: string,
    data: Record<string, string>,
    fix?: Rule.ReportFixer,
) => void;

export const getTypeScriptParserServices = (
    context: Rule.RuleContext,
): TypeScriptParserServices | undefined => {
    const parserServices = context.sourceCode.parserServices as TypeAwareParserServices;

    if (
        parserServices.program === undefined ||
        parserServices.esTreeNodeToTSNodeMap === undefined ||
        parserServices.tsNodeToESTreeNodeMap === undefined
    ) {
        return undefined;
    }

    return {
        getESTreeNode: node => parserServices.tsNodeToESTreeNodeMap?.get(node),
        getTypeScriptNode: node => parserServices.esTreeNodeToTSNodeMap?.get(node),
        program: parserServices.program,
    };
};

export const createTypeScriptNodeReporter =
    (context: Rule.RuleContext, parserServices: TypeScriptParserServices): TypeScriptNodeReporter =>
    (node, messageId, data, fix) => {
        const reportNode = parserServices.getESTreeNode(node);

        if (reportNode !== undefined) {
            context.report({ node: reportNode, messageId, data, fix });
        }
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

export const getNodeSourcePath = (node: Rule.Node): string | null => {
    if (
        'source' in node &&
        node.source &&
        typeof node.source === 'object' &&
        'value' in node.source &&
        typeof node.source.value === 'string'
    ) {
        return node.source.value;
    }

    return null;
};

export const createImportExportVisitors = (checkNode: (node: Rule.Node) => void) => ({
    ImportDeclaration: checkNode,
    ExportAllDeclaration: checkNode,
    ExportNamedDeclaration: checkNode,
});

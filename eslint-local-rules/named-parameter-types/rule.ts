import type { Rule } from 'eslint';

/** Enforces separately declared types for destructured object parameters. */
export const enforceNamedParameterTypesRule: Rule.RuleModule = {
    meta: {
        type: 'problem',
        docs: {
            description: 'Disallows direct inline object types on destructured parameters.',
            category: 'Best Practices',
            recommended: false,
        },
        messages: {
            inlineObjectType:
                'An inline object type on a destructured parameter must be declared separately.',
        },
        schema: [],
    },
    create: context => {
        const functionSelector =
            ':matches(ArrowFunctionExpression, FunctionDeclaration, FunctionExpression, TSDeclareFunction, TSEmptyBodyFunctionExpression)';
        const inlineTypeSelector = 'ObjectPattern > TSTypeAnnotation > TSTypeLiteral';
        const parameterSelectors = [
            `${functionSelector} > ${inlineTypeSelector}`,
            `${functionSelector} > AssignmentPattern > ${inlineTypeSelector}`,
        ];

        return {
            [parameterSelectors.join(', ')]: node => {
                context.report({ node, messageId: 'inlineObjectType' });
            },
        };
    },
};

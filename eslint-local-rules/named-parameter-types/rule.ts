import type { Rule } from 'eslint';
import ts from 'typescript';

import { createTypeScriptNodeReporter, getTypeScriptParserServices } from '../utils';

type SupportedFunction =
    | ts.ArrowFunction
    | ts.FunctionDeclaration
    | ts.FunctionExpression
    | ts.GetAccessorDeclaration
    | ts.MethodDeclaration
    | ts.SetAccessorDeclaration;

const isSupportedFunction = (node: ts.Node): node is SupportedFunction =>
    ts.isArrowFunction(node) ||
    ts.isFunctionDeclaration(node) ||
    ts.isFunctionExpression(node) ||
    ts.isGetAccessorDeclaration(node) ||
    ts.isMethodDeclaration(node) ||
    ts.isSetAccessorDeclaration(node);

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
        const parserServices = getTypeScriptParserServices(context);

        if (parserServices === undefined) {
            return {};
        }

        const report = createTypeScriptNodeReporter(context, parserServices);

        const validateFunction = (node: SupportedFunction) => {
            node.parameters.forEach(parameter => {
                if (
                    ts.isObjectBindingPattern(parameter.name) &&
                    parameter.type !== undefined &&
                    ts.isTypeLiteralNode(parameter.type)
                ) {
                    report(parameter.type, 'inlineObjectType', {});
                }
            });
        };

        const visitNode = (node: ts.Node) => {
            if (isSupportedFunction(node)) {
                validateFunction(node);
            }

            ts.forEachChild(node, visitNode);
        };

        return {
            'Program:exit': programNode => {
                const sourceFile = parserServices.getTypeScriptNode(programNode as Rule.Node);

                if (sourceFile !== undefined) {
                    visitNode(sourceFile);
                }
            },
        };
    },
};

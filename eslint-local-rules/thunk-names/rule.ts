import type { Rule } from 'eslint';
import ts from 'typescript';

import { getRtkThunkCallExpression, getThunkImplementationFromFunction } from '../thunks/utils';
import {
    createTypeScriptNodeReporter,
    getTypeScriptParserServices,
    getVariableFunction,
} from '../utils';

/** Enforces the Thunk suffix for RTK and vanilla Redux thunk declarations. */
export const enforceThunkNamesRule: Rule.RuleModule = {
    meta: {
        type: 'problem',
        docs: {
            description: 'Enforces the Thunk suffix for Redux thunk declarations.',
            category: 'Best Practices',
            recommended: false,
        },
        fixable: 'code',
        messages: {
            missingThunkSuffix: "Redux thunk name '{{thunkName}}' must end with 'Thunk'.",
        },
        schema: [],
    },
    create: context => {
        const parserServices = getTypeScriptParserServices(context);

        if (parserServices === undefined) {
            return {};
        }

        const report = createTypeScriptNodeReporter(context, parserServices);

        const getFixedName = (name: string) => {
            if (name.endsWith('Thunks')) {
                return name.slice(0, -1);
            }

            if (name.endsWith('ThunkInner')) {
                return name.slice(0, -'Inner'.length);
            }

            return `${name}Thunk`;
        };

        const createRenameFix = (name: ts.Identifier): Rule.ReportFixer | undefined => {
            const estreeName = parserServices.getESTreeNode(name);

            if (estreeName === undefined) {
                return undefined;
            }

            const fixedName = getFixedName(name.text);
            const hasNameConflict = context.sourceCode.scopeManager?.scopes.some(scope =>
                scope.set.has(fixedName),
            );

            if (hasNameConflict === true) {
                return undefined;
            }

            let scope = context.sourceCode.getScope(estreeName);
            let variable;

            while (scope !== null) {
                const candidate = scope.set.get(name.text);

                if (candidate?.identifiers.includes(estreeName as never) === true) {
                    variable = candidate;
                    break;
                }

                if (scope.upper === null) {
                    break;
                }

                scope = scope.upper;
            }

            if (variable === undefined) {
                return undefined;
            }

            const references = new Set<Rule.Node>([
                ...(variable.identifiers as Rule.Node[]),
                ...variable.references.map(reference => reference.identifier as Rule.Node),
            ]);

            return fixer =>
                [...references].map(reference => {
                    const typescriptReference = parserServices.getTypeScriptNode(reference);
                    const isShorthandProperty =
                        typescriptReference !== undefined &&
                        ts.isIdentifier(typescriptReference) &&
                        ts.isShorthandPropertyAssignment(typescriptReference.parent);

                    return fixer.replaceText(
                        reference,
                        isShorthandProperty ? `${name.text}: ${fixedName}` : fixedName,
                    );
                });
        };

        const validateName = (name: ts.Identifier) => {
            if (!name.text.endsWith('Thunk')) {
                report(name, 'missingThunkSuffix', { thunkName: name.text }, createRenameFix(name));
            }
        };

        const visitNode = (node: ts.Node) => {
            if (
                ts.isFunctionDeclaration(node) &&
                node.name !== undefined &&
                getThunkImplementationFromFunction(node) !== undefined
            ) {
                validateName(node.name);
            }

            if (
                ts.isVariableDeclaration(node) &&
                ts.isIdentifier(node.name) &&
                node.initializer !== undefined
            ) {
                const variableFunction = getVariableFunction(node);
                const isVanillaThunk =
                    variableFunction !== undefined &&
                    getThunkImplementationFromFunction(variableFunction) !== undefined;

                if (getRtkThunkCallExpression(node.initializer) !== undefined || isVanillaThunk) {
                    validateName(node.name);
                }
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

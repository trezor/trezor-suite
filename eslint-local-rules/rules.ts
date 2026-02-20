import type { Rule } from 'eslint';

const findNodeWithCalleeInSubTree = (node, calleeName) => {
    if (node.type === 'CallExpression' && node.callee.name === calleeName) {
        return node;
    }

    if (
        'callee' in node &&
        typeof node.callee === 'object' &&
        node.callee !== null &&
        'object' in node.callee
    ) {
        return findNodeWithCalleeInSubTree(node.callee.object, calleeName);
    }

    return null;
};

const checkNodeForAvoidStyledComponent = (node, context, nodeRef, importedComponents) => {
    if (node[nodeRef]?.type === 'CallExpression') {
        // We need to recursively search for the styled component in the call tree in case its chained
        //
        // Example:
        //      styled(Button).attrs(props => ({ ... {))`...`
        //
        const nodeWithCallee = findNodeWithCalleeInSubTree(node[nodeRef], 'styled');

        if (nodeWithCallee === null) {
            return;
        }

        if (
            nodeWithCallee.callee.name === 'styled' &&
            nodeWithCallee.arguments[0].type === 'Identifier'
        ) {
            const componentName = nodeWithCallee.arguments[0].name;

            // Check if component name matches any imported component from the specified packages
            for (const [pkgName, components] of importedComponents) {
                if (components.has(componentName)) {
                    context.report({
                        node,
                        messageId: 'avoidStyledComponent',
                        data: {
                            packageName: pkgName,
                        },
                    });
                    break;
                }
            }
        }
    }
};

/**
 * Returns the suggested import path for a deep import, or null if the import is allowed.
 * Handles the mocks convention: `@scope/pkg/mocks` is allowed, but `@scope/pkg/mocks/deep` suggests `@scope/pkg/mocks`.
 */
const getSuggestedImportPath = (sourcePath: string, packageScopes: string[]): string | null => {
    const sourcePathParts = sourcePath.split('/');

    if (sourcePathParts.length < 3) {
        return null;
    }

    const matchingPackageScope = packageScopes.find(packageScope =>
        sourcePath.startsWith(`${packageScope}/`),
    );

    if (matchingPackageScope === undefined) {
        return null;
    }

    const packageImportPath = `${matchingPackageScope}/${sourcePathParts[1]}`;

    // Allow @scope/pkg/mocks as a valid entry point
    if (sourcePathParts[2] === 'mocks') {
        if (sourcePathParts.length === 3) {
            return null;
        }

        return `${packageImportPath}/mocks`;
    }

    return packageImportPath;
};

const getNodeSourcePath = (node: Rule.Node): string | null => {
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

export default {
    'no-override-ds-component': {
        meta: {
            type: 'problem',
            docs: {
                description:
                    'Disallows overriding components imported from a specific package using styled-components',

                category: 'Best Practices',
                recommended: false,
            },
            messages: {
                avoidStyledComponent:
                    "Please do not override components imported from '{{packageName}}'. Use wrapper component or ask Growth team for help.",
            },
            schema: [
                {
                    type: 'object',
                    properties: {
                        packageNames: {
                            type: 'array',
                            items: { type: 'string' },
                            minItems: 1,
                        },
                    },
                    additionalProperties: false,
                },
            ],
        },
        create(context) {
            const packageNames = context.options[0]?.packageNames || [];
            if (packageNames.length === 0) {
                return {};
            }

            const importedComponents = new Map<string, Set<string>>(); // Map to store components per package name

            return {
                ImportDeclaration(node) {
                    if (packageNames.includes(node.source.value)) {
                        node.specifiers.forEach(specifier => {
                            if (
                                specifier.type === 'ImportSpecifier' ||
                                specifier.type === 'ImportDefaultSpecifier'
                            ) {
                                if (!importedComponents.has(node.source.value)) {
                                    importedComponents.set(node.source.value, new Set<string>());
                                }
                                importedComponents.get(node.source.value).add(specifier.local.name);
                            }
                        });
                    }
                },

                // This is for case the styled component is assigned to a variable but not evaluated with `...`
                VariableDeclarator(node) {
                    checkNodeForAvoidStyledComponent(node, context, 'init', importedComponents);
                },

                // This for case when the standard styled(Component)`...` is used
                TaggedTemplateExpression(node) {
                    checkNodeForAvoidStyledComponent(node, context, 'tag', importedComponents);
                },
            };
        },
    },
    'no-package-deep-imports': {
        meta: {
            type: 'problem',
            docs: {
                description:
                    'Disallows deep imports from selected package scopes and enforces package entry points.',
                category: 'Best Practices',
                recommended: false,
            },
            messages: {
                doNotImportPackageDeepPath:
                    "Importing from '{{sourcePath}}' is not allowed. Use '{{packageImportPath}}' instead.",
            },
            schema: [
                {
                    type: 'object',
                    properties: {
                        packageScopes: {
                            type: 'array',
                            items: { type: 'string' },
                            minItems: 1,
                        },
                    },
                    additionalProperties: false,
                },
            ],
        },
        create(context) {
            const packageScopes = context.options[0]?.packageScopes ?? [
                '@suite-native',
                '@suite',
                '@suite-common',
                '@trezor',
            ];

            const checkNode = (node: Rule.Node) => {
                const sourcePath = getNodeSourcePath(node);

                if (sourcePath === null) {
                    return;
                }

                const packageImportPath = getSuggestedImportPath(sourcePath, packageScopes);

                if (packageImportPath === null) {
                    return;
                }

                context.report({
                    node,
                    messageId: 'doNotImportPackageDeepPath',
                    data: {
                        packageImportPath,
                        sourcePath,
                    },
                });
            };

            return {
                ImportDeclaration: checkNode,
                ExportAllDeclaration: checkNode,
                ExportNamedDeclaration: checkNode,
            };
        },
    },
} satisfies Record<string, Rule.RuleModule>;

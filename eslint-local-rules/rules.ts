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
                    "Please do not override components imported from '{{packageName}}'. Use wrapper component or ask Usability team for help.",
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
} satisfies Record<string, Rule.RuleModule>;

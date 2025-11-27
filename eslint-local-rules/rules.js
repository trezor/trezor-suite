/** @typedef {import('eslint').Rule} Rule */

function findNodeWithCalleeInSubTree(node, calleeName) {
    if (!node) return null;

    if (node.type === 'CallExpression' && node.callee && node.callee.name === calleeName) {
        return node;
    }

    if (node.callee && typeof node.callee === 'object' && node.callee.object) {
        return findNodeWithCalleeInSubTree(node.callee.object, calleeName);
    }

    return null;
}

function checkNodeForAvoidStyledComponent(node, context, nodeRef, importedComponents) {
    if (node[nodeRef]?.type !== 'CallExpression') return;

    const nodeWithCallee = findNodeWithCalleeInSubTree(node[nodeRef], 'styled');
    if (!nodeWithCallee) return;

    if (
        nodeWithCallee.callee.name === 'styled' &&
        nodeWithCallee.arguments[0] &&
        nodeWithCallee.arguments[0].type === 'Identifier'
    ) {
        const componentName = nodeWithCallee.arguments[0].name;

        for (const [pkgName, components] of importedComponents) {
            if (components.has(componentName)) {
                context.report({
                    node,
                    messageId: 'avoidStyledComponent',
                    data: { packageName: pkgName },
                });
                break;
            }
        }
    }
}

module.exports = {
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
            if (packageNames.length === 0) return {};

            const importedComponents = new Map();

            return {
                ImportDeclaration(node) {
                    if (packageNames.includes(node.source.value)) {
                        node.specifiers.forEach(specifier => {
                            if (
                                specifier.type === 'ImportSpecifier' ||
                                specifier.type === 'ImportDefaultSpecifier'
                            ) {
                                if (!importedComponents.has(node.source.value)) {
                                    importedComponents.set(node.source.value, new Set());
                                }
                                importedComponents.get(node.source.value).add(specifier.local.name);
                            }
                        });
                    }
                },

                VariableDeclarator(node) {
                    checkNodeForAvoidStyledComponent(node, context, 'init', importedComponents);
                },

                TaggedTemplateExpression(node) {
                    checkNodeForAvoidStyledComponent(node, context, 'tag', importedComponents);
                },
            };
        },
    },

    'no-classname-on-component': {
        meta: {
            type: 'problem',
            docs: {
                description:
                    'Disallows passing className to React components (non-DOM) including styled-components',
                recommended: false,
            },
            messages: {
                avoidClassName:
                    "Do not pass 'className' to custom components or styled-components. Use wrappers or styling alternatives.",
            },
            schema: [
                {
                    type: 'object',
                    properties: {
                        excluded: {
                            type: 'array',
                            items: { type: 'string' },
                        },
                    },
                    additionalProperties: false,
                },
            ],
        },

        create(context) {
            const excluded = new Set(context.options[0]?.excluded || []);

            function isDomElement(name) {
                // <div>, <button>, <svg> -> OK
                return /^[a-z]/.test(name);
            }

            function getComponentName(node) {
                if (node.type === 'JSXIdentifier') return node.name;

                if (node.type === 'JSXMemberExpression') {
                    return node.object.name || null;
                }

                if (node.type === 'JSXNamespacedName') {
                    return node.name.name;
                }

                return null;
            }

            return {
                JSXAttribute(node) {
                    if (node.name.name !== 'className') return;

                    const jsxEl = node.parent;
                    if (!jsxEl || jsxEl.type !== 'JSXOpeningElement') return;

                    const tag = jsxEl.name;
                    const componentName = getComponentName(tag);

                    if (!componentName) return;

                    if (isDomElement(componentName)) {
                        return;
                    }

                    if (excluded.has(componentName)) {
                        return;
                    }


                    context.report({
                        node,
                        messageId: 'avoidClassName',
                    });
                },
            };
        },
    },
};

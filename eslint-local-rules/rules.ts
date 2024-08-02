import type { Rule } from 'eslint';

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
                        packageName: {
                            type: 'string',
                        },
                    },
                    additionalProperties: false,
                },
            ],
        },
        create(context) {
            const packageName = context.options[0] && context.options[0].packageName;
            if (!packageName) {
                return {};
            }

            const importedComponents = new Set();

            return {
                ImportDeclaration(node) {
                    if (node.source.value === packageName) {
                        node.specifiers.forEach(specifier => {
                            if (
                                specifier.type === 'ImportSpecifier' ||
                                specifier.type === 'ImportDefaultSpecifier'
                            ) {
                                importedComponents.add(specifier.local.name);
                            }
                        });
                    }
                },
                TaggedTemplateExpression(node) {
                    if (
                        node.tag.type === 'CallExpression' &&
                        node.tag.callee.name === 'styled' &&
                        node.tag.arguments[0].type === 'Identifier' &&
                        importedComponents.has(node.tag.arguments[0].name)
                    ) {
                        context.report({
                            node,
                            messageId: 'avoidStyledComponent',
                            data: {
                                packageName,
                            },
                        });
                    }
                },
            };
        },
    },
} satisfies Record<string, Rule.RuleModule>;

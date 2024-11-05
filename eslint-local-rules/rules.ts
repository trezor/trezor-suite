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
                TaggedTemplateExpression(node) {
                    if (
                        node.tag.type === 'CallExpression' &&
                        node.tag.callee.name === 'styled' &&
                        node.tag.arguments[0].type === 'Identifier'
                    ) {
                        const componentName = node.tag.arguments[0].name;

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
                },
            };
        },
    },
} satisfies Record<string, Rule.RuleModule>;

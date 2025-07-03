import type { Rule } from 'eslint';

export const noObjectKeysRule: Rule.RuleModule = {
    meta: {
        type: 'problem',
        docs: {
            description: 'Disallow Object.keys in favor of typedObjectKeys',
            category: 'Best Practices',
            recommended: false,
        },
        fixable: 'code',
        messages: {
            useTypedObjectKeys: "Use 'typedObjectKeys' instead of 'Object.keys'.",
        },
        schema: [],
    },

    create(context) {
        let hasTypedObjectKeysImport = false;

        return {
            Program(node) {
                // Check if typedObjectKeys is already imported
                for (const stmt of node.body) {
                    if (
                        stmt.type === 'ImportDeclaration' &&
                        stmt.source.value === '@trezor/utils'
                    ) {
                        for (const spec of stmt.specifiers) {
                            if (
                                spec.type === 'ImportSpecifier' &&
                                spec.imported.name === 'typedObjectKeys'
                            ) {
                                hasTypedObjectKeysImport = true;
                                return;
                            }
                        }
                    }
                }
            },
            CallExpression(node) {
                // Match Object.keys(...)
                if (
                    node.callee.type === 'MemberExpression' &&
                    node.callee.object.name === 'Object' &&
                    node.callee.property.name === 'keys'
                ) {
                    context.report({
                        node,
                        messageId: 'useTypedObjectKeys',
                        fix(fixer) {
                            const sourceCode = context.getSourceCode();
                            const argsText = node.arguments
                                .map(arg => sourceCode.getText(arg))
                                .join(', ');
                            const fixes = [fixer.replaceText(node, `typedObjectKeys(${argsText})`)];

                            // Add import if missing
                            if (!hasTypedObjectKeysImport) {
                                const firstImport = sourceCode.ast.body.find(
                                    n => n.type === 'ImportDeclaration',
                                );
                                if (firstImport) {
                                    fixes.push(
                                        fixer.insertTextBefore(
                                            firstImport,
                                            `import { typedObjectKeys } from '@trezor/utils';\n`,
                                        ),
                                    );
                                } else {
                                    fixes.push(
                                        fixer.insertTextBeforeRange(
                                            [0, 0],
                                            `import { typedObjectKeys } from '@trezor/utils';\n`,
                                        ),
                                    );
                                }
                            }

                            return fixes;
                        },
                    });
                }
            },
        };
    },
};

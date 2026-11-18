import type { AST, Rule } from 'eslint';

type DisableDirective = {
    type: 'disable' | 'enable' | 'disable-line' | 'disable-next-line';
    node: { loc: AST.SourceLocation };
    value: string;
};

// ESLint applies the directives from `SourceCode#getDisableDirectives`, which its type definitions
// leave out.
type SourceCodeWithDisableDirectives = {
    getDisableDirectives: () => { directives: DisableDirective[] };
};

// Each CI lint job runs one rule set through ESLint's rule filter, and with any rule filtered ESLint
// never reports an eslint-disable comment without rule names as unused (see
// packages/eslint/src/ruleSets.mjs). Naming the rules keeps every such comment checked.
export const noUnlimitedDisableRule: Rule.RuleModule = {
    meta: {
        type: 'suggestion',
        docs: {
            description: 'Requires eslint-disable comments to name the rules they disable.',
            category: 'Best Practices',
            recommended: false,
        },
        messages: {
            unlimitedDisable: "Name the rules this 'eslint-{{type}}' comment disables.",
        },
        schema: [],
    },
    create(context) {
        return {
            Program() {
                const { directives } = (
                    context.sourceCode as unknown as SourceCodeWithDisableDirectives
                ).getDisableDirectives();

                for (const { type, node, value } of directives) {
                    if (type === 'enable' || value !== '') {
                        continue;
                    }

                    context.report({
                        // Column -1 puts the report before the comment, so that the directive does
                        // not suppress it.
                        loc: {
                            start: { line: node.loc.start.line, column: -1 },
                            end: node.loc.end,
                        },
                        messageId: 'unlimitedDisable',
                        data: { type },
                    });
                }
            },
        };
    },
};

import { eslint, noRestrictedSyntax, playwrightEslintFlat } from '@trezor/eslint';

export default [
    ...eslint,
    {
        ignores: ['**/playwright-report/', '**/test-results/'],
    },
    {
        files: ['**/scripts/**'],
        rules: {
            'no-console': 'off',
            'import/no-default-export': 'off',
        },
    },
    playwrightEslintFlat,
    {
        rules: {
            'no-restricted-syntax': [
                'error',
                ...noRestrictedSyntax,
                {
                    selector:
                        "CallExpression[callee.type='MemberExpression'][callee.property.name=/^(textContent|allTextContents)$/]",
                    message:
                        'To assert text prefer the auto-retrying expect(locator).toHaveText(), otherwise use innerText()/allInnerTexts().',
                },
            ],
        },
    },
    {
        files: ['**/tests/**/*.test.ts'],
        rules: {
            'local-rules/enforce-e2e-test-stream': 'error',
        },
    },
    {
        files: ['**/tests/manual/**'],
        rules: {
            'playwright/no-skipped-test': 'off',
        },
    },
];

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
        // The report pipeline's jest unit tests — not Playwright tests, despite the .test.ts name
        // (see jest.config.cjs, which is scoped to exactly this directory).
        files: ['performance/report/**/*.test.ts'],
        rules: {
            'playwright/no-standalone-expect': 'off',
            // Misfires on jest's beforeEach/afterEach pair.
            'playwright/no-duplicate-hooks': 'off',
        },
    },
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
        files: ['**/tests/manual/**'],
        rules: {
            'playwright/no-skipped-test': 'off',
        },
    },
];

import { eslint, playwrightEslintFlat } from '@trezor/eslint';

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
        files: ['**/tests/manual/**'],
        rules: {
            'playwright/no-skipped-test': 'off',
        },
    },
];

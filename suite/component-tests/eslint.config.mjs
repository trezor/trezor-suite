import { eslint, playwrightEslintFlat } from '@trezor/eslint';

export default [
    ...eslint,
    {
        ignores: ['**/dist-gallery/', '**/playwright-report/', '**/test-results/', '**/libDev/'],
    },
    playwrightEslintFlat,
    {
        // Everything in this package is test code, so its dependencies belong in devDependencies.
        // Mirrors the `**/*e2e/**` entry the shared config carries for `suite/e2e`.
        rules: {
            'import/no-extraneous-dependencies': ['error', { devDependencies: true }],
        },
    },
];

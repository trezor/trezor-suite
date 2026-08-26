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
    {
        // Stories mount app components that their package does not export — `@trezor/suite`
        // exports only the store and its mocks. Co-locating stories inside `packages/suite` would
        // remove the need for this.
        files: ['gallery/**', 'stories/**', 'tests/**'],
        rules: {
            'local-rules/no-package-deep-imports': 'off',
        },
    },
];

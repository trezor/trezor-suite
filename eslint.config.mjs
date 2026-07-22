import { eslint, globalNoExtraneousDependenciesDevDependencies } from '@trezor/eslint';

export default [
    ...eslint,
    {
        rules: {
            'import/no-extraneous-dependencies': [
                'error',
                {
                    devDependencies: [
                        ...globalNoExtraneousDependenciesDevDependencies,
                        '**/connect-examples/**', // This must be here, connect-examples are not a package
                        '**/eslint-local-rules/**', // Uses ts-node at runtime when loaded by ESLint
                    ],
                },
            ],
            'no-restricted-imports': [
                'error',
                {
                    patterns: [
                        {
                            regex: '/libDev/src',
                            message: 'Importing from "*/libDev/src" path is not allowed.',
                        },
                    ],
                },
            ],
        },
    },
    {
        // TARGET: Storybook files anywhere in the project
        files: ['**/*.stories.@(ts|tsx|js|jsx)'],
        rules: {
            'import/no-default-export': 'off', // Storybook stories need default exports by design.
            'react-hooks/rules-of-hooks': 'off', // It is possible to use hooks in Storybook stories outside of the component (e.g in the render method).
        },
    },
    {
        // Platform detection must not leak into the platform-agnostic shared code (suite-common).
        // Receive the platform-specific value via dependency injection through a composition root
        // instead — see the thpHostName / createConnectLoggerFactory pattern in @trezor/suite.
        // NOTE: this override replaces the root `no-restricted-imports` for these files, so the
        // libDev pattern above is re-declared here to keep it in effect.
        // isWeb is banned everywhere in suite-common; isDesktop is additionally banned in the
        // .ts-only override below (components in .tsx still lack a good DI pattern for it).
        files: ['suite-common/**/src/**/*.@(ts|tsx)'],
        ignores: ['**/__tests__/**', '**/__fixtures__/**', '**/*.test.@(ts|tsx)'],
        rules: {
            'no-restricted-imports': [
                'error',
                {
                    paths: [
                        {
                            name: '@trezor/env-utils',
                            importNames: ['isWeb'],
                            message:
                                'Do not detect the platform inside platform-agnostic suite-common code. Inject the platform-specific value via a composition root (see the thpHostName / createConnectLoggerFactory pattern). isNative is intentionally not banned yet only because pre-existing call sites remain — do not add new ones.',
                        },
                    ],
                    patterns: [
                        {
                            regex: '/libDev/src',
                            message: 'Importing from "*/libDev/src" path is not allowed.',
                        },
                    ],
                },
            ],
        },
    },
    {
        // Non-component (.ts) shared code additionally must not detect the platform via isDesktop.
        // .tsx components are deliberately excluded: they have no good DI pattern for injecting the
        // platform value yet, so this override targets .ts only. It fully replaces the .ts entry of
        // the .@(ts|tsx) override above, so isWeb (and the libDev pattern) are re-declared here.
        files: ['suite-common/**/src/**/*.ts'],
        ignores: ['**/__tests__/**', '**/__fixtures__/**', '**/*.test.ts'],
        rules: {
            'no-restricted-imports': [
                'error',
                {
                    paths: [
                        {
                            name: '@trezor/env-utils',
                            importNames: ['isWeb', 'isDesktop'],
                            message:
                                'Do not detect the platform inside platform-agnostic suite-common code. Inject the platform-specific value via a composition root (see the thpHostName / createConnectLoggerFactory pattern). isNative is intentionally not banned yet only because pre-existing call sites remain — do not add new ones.',
                        },
                    ],
                    patterns: [
                        {
                            regex: '/libDev/src',
                            message: 'Importing from "*/libDev/src" path is not allowed.',
                        },
                    ],
                },
            ],
        },
    },
];

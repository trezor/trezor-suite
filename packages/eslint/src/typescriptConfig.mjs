import tseslint from 'typescript-eslint';

/** @type {import('typescript-eslint').ConfigArray} */
export const typescriptConfig = [
    ...tseslint.configs.recommended,
    {
        rules: {
            // Additional rules
            '@typescript-eslint/no-use-before-define': ['error'],
            '@typescript-eslint/no-shadow': [
                'error',
                {
                    builtinGlobals: false,
                    allow: ['_', 'error', 'resolve', 'reject', 'fetch'],
                },
            ],
            '@typescript-eslint/no-restricted-imports': [
                'error',
                {
                    paths: [{ name: '.' }, { name: '..' }, { name: '../..' }],
                    patterns: [
                        '@trezor/*/lib',
                        '@trezor/*/lib/**',
                        '@trezor/*/libDev',
                        '@trezor/*/libDev/**',
                        '@trezor/*/libESM',
                        '@trezor/*/libESM/**',
                    ],
                },
            ],

            // Additions from "plugin:@typescript-eslint/strict" (we may turn this on one day as a whole)
            '@typescript-eslint/no-useless-constructor': ['error'],
            '@typescript-eslint/no-unused-vars': [
                'error',
                {
                    vars: 'all',
                    args: 'none',
                    ignoreRestSiblings: true,
                    varsIgnorePattern: '^_',
                },
            ],

            // Offs
            '@typescript-eslint/no-require-imports': 'off', // We just use require a lot (mostly for dynamic imports)
            '@typescript-eslint/no-explicit-any': 'off', // Todo: write description
            '@typescript-eslint/ban-ts-comment': [
                'error',
                {
                    minimumDescriptionLength: 0, // Todo: reconsider
                },
            ],
            '@typescript-eslint/no-empty-object-type': 'off', // Todo: we shall solve this, this is bad practice
        },
    },
    {
        // restrict import of suite-common and suite-native packages outside of suite
        files: ['packages/**/*.{js,mjs,cjs,ts,jsx,tsx}'],
        ignores: ['packages/suite*/**/*'],
        rules: {
            '@typescript-eslint/no-restricted-imports': [
                'error',
                {
                    paths: [{ name: '.' }, { name: '..' }, { name: '../..' }],
                    patterns: [
                        '@trezor/*/lib',
                        '@trezor/*/lib/**',
                        '@trezor/*/libDev',
                        '@trezor/*/libDev/**',
                        '@suite-common/**',
                        '@suite-native/**',
                    ],
                },
            ],
        },
    },
    {
        files: ['**/src/**/*.{ts,tsx}'],
        languageOptions: {
            parserOptions: {
                projectService: true,
                allowDefaultProject: true,
            },
        },
        rules: {
            '@typescript-eslint/consistent-type-imports': [
                'error',
                {
                    fixStyle: 'inline-type-imports',
                    prefer: 'type-imports',
                },
            ],
            '@typescript-eslint/consistent-type-exports': [
                'error',
                {
                    fixMixedExportsWithInlineTypeSpecifier: true,
                },
            ],
        },
    },
];

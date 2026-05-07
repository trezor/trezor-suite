import tseslint from 'typescript-eslint';

// Deny importing from build artifact directories — consumers should resolve
// through the package root, not from `lib/`, `libDev/`, or `libESM/`.
const buildArtifactPatterns = {
    group: [
        '@trezor/*/lib',
        '@trezor/*/lib/**',
        '@trezor/*/libDev',
        '@trezor/*/libDev/**',
        '@trezor/*/libESM',
        '@trezor/*/libESM/**',
    ],
    message:
        'Import from the package root instead. Deep paths into "lib/", "libDev/" or "libESM/" target build artifacts that may not exist or may diverge from the workspace source.',
};

// Deep-path imports that bypass the public barrels of the connect-tier packages.
// Tracked in https://github.com/trezor/trezor-suite/issues/27376.
// External consumers must import from the package root (e.g. `@trezor/connect`).
// A handful of legitimate cross-package wiring imports inside the connect-tier
// (e.g. connect-webextension re-using connect-web impls) and a few deferred
// refactors carry an inline `// eslint-disable-next-line` exception with a
// pointer back to this issue.
const connectDeepImportPatterns = [
    {
        group: ['@trezor/connect/src/**'],
        message:
            'Import from "@trezor/connect" instead. Deep paths into "@trezor/connect/src/**" bypass the public barrel.',
    },
    {
        group: ['@trezor/connect-web/src/**'],
        message:
            'Import from "@trezor/connect-web" instead. Deep paths into "@trezor/connect-web/src/**" bypass the public barrel.',
    },
    {
        group: ['@trezor/connect-webextension/src/**'],
        message:
            'Import from "@trezor/connect-webextension" instead. Deep paths into "@trezor/connect-webextension/src/**" bypass the public barrel.',
    },
];

// Deny importing internal suite packages from outside the suite app itself.
const suiteInternalPatterns = {
    group: ['@suite-common/**', '@suite-native/**'],
    message:
        '@suite-common/* and @suite-native/* packages are private to the suite apps and must not be imported by other workspace packages.',
};

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
                    patterns: [buildArtifactPatterns, ...connectDeepImportPatterns],
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
                        buildArtifactPatterns,
                        suiteInternalPatterns,
                        ...connectDeepImportPatterns,
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

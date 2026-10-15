import { fileURLToPath } from 'node:url';
import tseslint from 'typescript-eslint';

import { areExpensiveChecksEnabled } from './expensiveChecks.mjs';
import { allRoots } from './workspaceRoots.mjs';

// Deny importing from build artifact directories — consumers should resolve
// through the package root, not from `lib/` or `libDev/`.
const buildArtifactPatterns = {
    group: ['@trezor/*/lib', '@trezor/*/lib/**', '@trezor/*/libDev', '@trezor/*/libDev/**'],
    message:
        'Import from the package root instead. Deep paths into "lib/" or "libDev/" target build artifacts that may not exist or may diverge from the workspace source.',
};

// Bare network packages expose sectioned entry points. Type contracts, asset packages and Suite
// layer packages keep root imports; a dash in a network name alone does not exempt a bare package.
const networksPackagePattern = {
    regex: '^@trezor/(?![^/]*-(?:types|assets|suite(?:-common|-native)?)$)network-[^/]+$',
    message: 'Import from /constants, /runtime or /types subpath.',
};

// Network packages are a reusable layer: the apps are built on top of them, never the other way
// round. Of the workspace scopes only `@trezor/*` is below them, so it is the only one they may
// depend on. Anything an app owns reaches a network module through dependency injection instead.
const networksAppScopePattern = {
    group: ['@suite/**', '@suite-cli/**', '@suite-common/**', '@suite-native/**'],
    message:
        'Network packages may only depend on @trezor/* workspace packages. Take anything an app owns as an injected dependency instead.',
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

/*
 Currently only relevant in @suite/desktop-app-main, but if the ipcMain import is to be used elsewhere,
 the wrapper shall be extracted and this should still be a global rule.
*/
const electronIpcMainRestrictedImport = {
    name: 'electron',
    importNames: ['ipcMain'],
    message: 'Use the local ipcMain wrapper instead.',
};

const commonRestrictedImports = {
    paths: [{ name: '.' }, { name: '..' }, { name: '../..' }, electronIpcMainRestrictedImport],
    patterns: [buildArtifactPatterns, networksPackagePattern, ...connectDeepImportPatterns],
};

const nativeRestrictedImports = {
    ...commonRestrictedImports,
    paths: [
        ...commonRestrictedImports.paths,
        {
            name: 'react-native-reanimated',
            importNames: ['default', 'createAnimatedComponent'],
            allowTypeImports: true,
            message:
                'Use animated components from @suite-native/atoms so reduced motion is handled consistently. Import Reanimated hooks, animation builders and types by name.',
        },
        {
            name: 'lottie-react-native',
            importNames: ['default', 'LottieView'],
            allowTypeImports: true,
            message:
                'Use LottieView from @suite-native/atoms so reduced motion is handled consistently.',
        },
    ],
    patterns: [
        ...commonRestrictedImports.patterns,
        {
            group: ['react-native-reanimated/*'],
            message:
                'Use the public react-native-reanimated entry point for hooks and types, and @suite-native/atoms for animated components.',
        },
        {
            group: ['lottie-react-native/*'],
            message:
                'Use LottieView from @suite-native/atoms so reduced motion is handled consistently.',
        },
    ],
};

// Deep paths into Suite packages bypass their barrels and tie consumers to file layout, so the
// staking trees refuse them. `@suite-common/schemas` has no barrel and is reached by its sections.
const suiteCommonDeepImportPattern = {
    group: ['@suite-common/*/src/**', '!@suite-common/schemas/src/**'],
    message:
        'Import from the package root instead. Deep paths into "@suite-common/*/src/**" bypass the public barrel.',
};

const withSuiteCommonDeepImportGuard = restrictedImports => ({
    ...restrictedImports,
    patterns: [...restrictedImports.patterns, suiteCommonDeepImportPattern],
});

const repositoryRoot = fileURLToPath(new URL('../../../', import.meta.url));

const stakingTrees = {
    suite: [
        `${allRoots.suiteCommon}/wallet-core/src/staking/**/*.{ts,tsx}`,
        `${allRoots.suiteCommon}/wallet-utils/src/stakingUtils.ts`,
        `${allRoots.packages}/suite/src/actions/wallet/stake/**/*.{ts,tsx}`,
        `${allRoots.packages}/suite/src/actions/wallet/stakeActions.ts`,
        `${allRoots.packages}/suite/src/hooks/earn/**/*.{ts,tsx}`,
        `${allRoots.packages}/suite/src/views/wallet/staking/**/*.{ts,tsx}`,
        `${allRoots.packages}/suite/src/components/earn/**/*.{ts,tsx}`,
    ],
    native: [`${allRoots.suiteNative}/module-earn/src/**/*.{ts,tsx}`],
};

export const restrictedImportsPatterns = [
    buildArtifactPatterns,
    suiteInternalPatterns,
    networksPackagePattern,
    ...connectDeepImportPatterns,
];

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
            '@typescript-eslint/no-restricted-imports': ['error', commonRestrictedImports],

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
        // An absolute base also applies when a native package has its own ESLint config.
        basePath: fileURLToPath(new URL(`../../../${allRoots.suiteNative}`, import.meta.url)),
        files: ['**/*.{js,mjs,cjs,ts,jsx,tsx}'],
        ignores: ['atoms/src/Animated/**'],
        rules: {
            '@typescript-eslint/no-restricted-imports': ['error', nativeRestrictedImports],
        },
    },
    {
        basePath: repositoryRoot,
        files: stakingTrees.suite,
        rules: {
            '@typescript-eslint/no-restricted-imports': [
                'error',
                withSuiteCommonDeepImportGuard(commonRestrictedImports),
            ],
        },
    },
    {
        basePath: repositoryRoot,
        files: stakingTrees.native,
        rules: {
            '@typescript-eslint/no-restricted-imports': [
                'error',
                withSuiteCommonDeepImportGuard(nativeRestrictedImports),
            ],
        },
    },
    {
        files: [`${allRoots.networks}/**/*.{js,mjs,cjs,ts,jsx,tsx}`],
        rules: {
            '@typescript-eslint/no-restricted-imports': [
                'error',
                {
                    paths: [
                        { name: '.' },
                        { name: '..' },
                        { name: '../..' },
                        electronIpcMainRestrictedImport,
                    ],
                    patterns: [
                        buildArtifactPatterns,
                        networksAppScopePattern,
                        networksPackagePattern,
                        ...connectDeepImportPatterns,
                        {
                            regex: '^@trezor/connect(?!-common(?:/|$))',
                            message:
                                'Network modules must receive Connect through dependency injection. Import contracts from @trezor/connect-common.',
                        },
                    ],
                },
            ],
        },
    },
    {
        // Suite application roots can compose shared services.
        files: [`${allRoots.packages}/**/*.{js,mjs,cjs,ts,jsx,tsx}`],
        ignores: [`${allRoots.packages}/suite*/**/*`],
        rules: {
            '@typescript-eslint/no-restricted-imports': [
                'error',
                {
                    paths: [
                        { name: '.' },
                        { name: '..' },
                        { name: '../..' },
                        electronIpcMainRestrictedImport,
                    ],
                    patterns: restrictedImportsPatterns,
                },
            ],
        },
    },
    {
        files: ['**/src/**/*.{ts,tsx}'],
        languageOptions: {
            parserOptions: {
                projectService: true,
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
            '@typescript-eslint/prefer-optional-chain': ['error'],
            // Known limitation: the rule mis-reports some load-bearing widening assertions
            // (removing them breaks tsc); such spots carry a scoped disable with a justification.
            '@typescript-eslint/no-unnecessary-type-assertion': ['error'],

            // Type-checked rule; the src override is the only block with type info. Prefer
            // startsWith/endsWith over indexOf(x) === 0, slice(-1) === c and /^x/.test().
            '@typescript-eslint/prefer-string-starts-ends-with': ['error'],
        },
    },
    {
        // Type assertions on partial mocks and fixtures are idiomatic in tests,
        // so scope the rule out of test and fixture files.
        files: ['**/__tests__/**', '**/__fixtures__/**', '**/tests/**', '**/*.test.{ts,tsx}'],
        rules: {
            '@typescript-eslint/no-unnecessary-type-assertion': 'off',
        },
    },
    ...(areExpensiveChecksEnabled
        ? []
        : [
              {
                  ...tseslint.configs.disableTypeChecked,
                  files: ['**/src/**/*.{ts,tsx}'],
              },
          ]),
];

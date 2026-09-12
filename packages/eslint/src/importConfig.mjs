import { fixupConfigRules } from '@eslint/compat';
import pluginImport from 'eslint-plugin-import';
import path from 'path';
import { fileURLToPath } from 'url';

/**
 * @typedef {import('eslint').Linter.Config} Config
 */

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const globalNoExtraneousDependenciesDevDependencies = [
    // ----------------------------------------------------------------
    // !!! DO NOT PUT STUFF THAT BELONGS TO THE PACKAGE ITSELF HERE !!!
    // Only shared stuff (like tests.*.ts(x) or fixtures shall be here)
    // ----------------------------------------------------------------
    '**/*fixtures*/**',
    '**/mocks/**',
    '**/*.test.{tsx,ts,js}',
    '**/eslint.config.mjs', // for CJS packages, those files should eventually be renamed to .js and this line deleted
    '**/eslint.config.js',

    '**/*e2e/**', // Todo: This shall be only in packages that has e2e tests
];

const desktopApiImplementationMessage =
    'Only a composition root may choose a DesktopApi implementation. Declare DesktopApiDep and take the API as an injected dependency, or use selectDesktopApiDep in React.';

/**
 * `@trezor/suite-desktop-api` holds the contract and is free to import anywhere. Its two
 * implementations are picked once, by the web and desktop composition roots (and the Electron
 * preload script, which builds the bridge). See the allowances in the root eslint.config.mjs.
 */
export const desktopApiRestrictedImports = [
    { name: '@trezor/suite-desktop-api-electron', message: desktopApiImplementationMessage },
    { name: '@trezor/suite-desktop-api-web', message: desktopApiImplementationMessage },
];

export const libDevRestrictedImportPattern = {
    regex: '/libDev/src',
    message: 'Importing from "*/libDev/src" path is not allowed.',
};

/**
 * The only places allowed to choose a DesktopApi implementation. The composition roots build the
 * app's dependency graph; the preload script builds the Electron bridge that
 * `createElectronDesktopApi` later reads back from `contextBridge`.
 *
 * ESLint resolves a config per linted file, so a package with its own eslint.config.mjs matches
 * these patterns against a path relative to that package. Matching on the file name keeps one
 * pattern correct from either base; all three names are unique in the repository.
 *
 * @type {Config}
 */
export const desktopApiCompositionRootAllowance = {
    files: [
        '**/preload.ts', // packages/suite-desktop-core
        '**/createSuiteDesktopCompositionRoot.ts', // packages/suite-desktop-ui
        '**/createSuiteWebCompositionRoot.ts', // packages/suite-web
    ],
    rules: {
        'no-restricted-imports': ['error', { patterns: [libDevRestrictedImportPattern] }],
    },
};

/** @type {Config[]} */
export const importConfig = [
    // TODO: Remove the compatibility wrapper when eslint-plugin-import supports ESLint 10.
    ...fixupConfigRules(pluginImport.flatConfigs.recommended),
    {
        settings: {
            'import/ignore': ['node_modules', '\\.(coffee|scss|css|less|hbs|svg|json)$'],
            'import/resolver': {
                node: {
                    paths: [path.resolve(__dirname, 'eslint-rules')],
                },
            },
        },
        rules: {
            'no-restricted-imports': ['error', { paths: [...desktopApiRestrictedImports] }],

            // Additional
            'import/no-default-export': 'error', // We don't want to use default exports, always use named exports
            'import/no-anonymous-default-export': [
                'error',
                {
                    allowArray: true,
                    allowLiteral: true,
                    allowObject: true,
                },
            ],
            'sort-imports': [
                1,
                {
                    ignoreCase: false,
                    ignoreDeclarationSort: true, // don't want to sort import lines, use eslint-plugin-import instead
                    ignoreMemberSort: false,
                    memberSyntaxSortOrder: ['none', 'all', 'multiple', 'single'],
                    allowSeparatedGroups: true,
                },
            ],
            'import/order': [
                'warn',
                {
                    groups: [['builtin', 'external'], 'internal', ['sibling', 'parent']],
                    pathGroups: [
                        {
                            pattern: 'react*',
                            group: 'external',
                            position: 'before',
                        },
                        { pattern: '@trezor/**', group: 'internal' }, // Translates to /packages/** */
                        { pattern: '@suite-native/**', group: 'internal' },
                        { pattern: '@suite-common/**', group: 'internal' },
                        { pattern: '@suite/**', group: 'internal' },
                        { pattern: 'src/**', group: 'internal', position: 'after' },
                    ],
                    pathGroupsExcludedImportTypes: ['internal', 'react'],
                    'newlines-between': 'always',
                    alphabetize: { order: 'asc' },
                },
            ],
            'import/no-extraneous-dependencies': [
                'error',
                {
                    devDependencies: globalNoExtraneousDependenciesDevDependencies,
                    includeTypes: true,
                },
            ],

            // Offs
            'import/no-unresolved': 'off', // Does not work with Babel react-native to react-native-web
        },
    },
    desktopApiCompositionRootAllowance,
];

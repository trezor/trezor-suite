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
    '**/*.test.{tsx,ts,js}',
    '**/eslint.config.mjs', // for CJS packages, those files should eventually be renamed to .js and this line deleted
    '**/eslint.config.js',

    '**/*e2e/**', // Todo: This shall be only in packages that has e2e tests
];

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
];

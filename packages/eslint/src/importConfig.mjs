import { fixupConfigRules } from '@eslint/compat';
import pluginImport from 'eslint-plugin-import';
import path from 'path';
import { fileURLToPath } from 'url';

/**
 * @typedef {import('eslint').Linter.Config} Config
 */

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Grants the listed files permission to import devDependencies. Flat config replaces rule options
 * instead of merging them, so exemptions are scoped by `files` rather than collected into one
 * shared glob list that every package would have to spread back in.
 *
 * @type {(files: string[]) => Config}
 */
export const allowDevDependenciesIn = files => ({
    files,
    rules: {
        'import/no-extraneous-dependencies': [
            'error',
            { devDependencies: true, includeTypes: true },
        ],
    },
});

/**
 * Allows type-only imports to resolve to devDependencies in the listed files, while value imports
 * must still come from `dependencies`. Use this where promoting the package to `dependencies` would
 * enlarge a published dependency closure that the repository deliberately keeps small.
 *
 * @type {(files: string[]) => Config}
 */
export const allowTypeOnlyDevDependenciesIn = files => ({
    files,
    rules: {
        'import/no-extraneous-dependencies': [
            'error',
            { devDependencies: false, includeTypes: false },
        ],
    },
});

const desktopApiImplementationMessage =
    'Only a composition root may choose a DesktopApi implementation. Declare DesktopApiDep and take the API as an injected dependency, or use selectDesktopApiDep in React.';

export const desktopApiRestrictedImports = [
    { name: '@suite/desktop-app-api-electron', message: desktopApiImplementationMessage },
];

/**
 * Build-artifact imports stay blocked for these files through
 * `@typescript-eslint/no-restricted-imports`, which this does not touch.
 */
/** @type {Config} */
export const desktopApiCompositionRootAllowance = {
    files: ['**/preload.ts', '**/createSuiteDesktopCompositionRoot.ts'],
    rules: {
        'no-restricted-imports': 'off',
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
                { devDependencies: false, includeTypes: true },
            ],
            'import/newline-after-import': 'error',

            // Offs
            'import/no-unresolved': 'off', // Does not work with Babel react-native to react-native-web
        },
    },
    desktopApiCompositionRootAllowance,
    allowDevDependenciesIn([
        '**/*fixtures*/**',
        '**/mocks/**',
        '**/test-utils/**',
        '**/*.test.{tsx,ts,js}',
        '**/jest.setup.{js,ts}',
        '**/eslint.config.mjs', // for CJS packages, those files should eventually be renamed to .js and this line deleted
        '**/eslint.config.js',
        '**/forbiddenDeps.config.ts',
        '**/*e2e/**', // Todo: This shall be only in packages that has e2e tests
    ]),
];

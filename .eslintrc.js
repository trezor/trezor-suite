module.exports = {
    root: true,
    parser: '@typescript-eslint/parser',
    parserOptions: {
        // latest is best, because it's backwards compatible and we have linted everything
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: {
            jsx: true,
        },
    },
    plugins: ['import', '@typescript-eslint', 'react-hooks', 'jest', 'chai-friendly', 'react'],
    extends: [
        'plugin:@typescript-eslint/recommended',
        'plugin:react/recommended',
        'plugin:import/typescript',
        'plugin:react-hooks/recommended',
    ],
    settings: {
        react: {
            version: 'detect',
        },
        'import/ignore': ['node_modules', '\\.(coffee|scss|css|less|hbs|svg|json)$'],
    },
    env: {
        jest: true,
        'jest/globals': true,
    },
    ignorePatterns: [
        '**/lib/*',
        '**/libDev/*',
        '**/dist/*',
        '**/coverage/*',
        '**/build/*',
        '**/build-electron/*',
        '**/node_modules/*',
        '**/public/*',
        'packages/suite-data/files/*',
        'packages/protobuf/scripts/protobuf-patches/*',
        'packages/connect-examples',
        'ci/',
    ],
    rules: {
        '@typescript-eslint/prefer-ts-expect-error': 'error',
        // I believe type is enforced by callers.
        '@typescript-eslint/explicit-function-return-type': 'off',
        // Enforce arrow functions only is afaik not possible. But this helps.
        'func-style': [
            'error',
            'declaration',
            {
                allowArrowFunctions: true,
            },
        ],
        // Fix for TypeScript.
        'react/jsx-filename-extension': [
            'error',
            {
                extensions: ['.tsx'],
            },
        ],
        'import/order': [
            1,
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
                    { pattern: 'src/**', group: 'internal', position: 'after' },
                ],
                pathGroupsExcludedImportTypes: ['internal', 'react'],
                'newlines-between': 'always',
            },
        ],
        'import/no-extraneous-dependencies': [
            'error',
            {
                devDependencies: [
                    '**/*fixtures*/**',
                    '**/*.test.{tsx,ts,js}',
                    '**/blockchain-link/tests/**',
                    '**/blockchain-link/webpack/**',
                    '**/suite-desktop-core/**',
                    '**/*e2e/**',
                    '**/suite/src/support/tests/**',
                    '**/suite-data/**',
                    '**/*.stories.*',
                    '**/*webpack.config*',
                    '**/webpack/**',
                ],
                includeTypes: true,
            },
        ],
        // Does not work with TypeScript export type.
        'import/prefer-default-export': 'off',
        'import/no-named-as-default': 'off', // default export is forbidden anyway
        'no-nested-ternary': 'error',
        // Does not work with Babel react-native to react-native-web
        'import/no-unresolved': 'off',
        'import/extensions': 'off',
        // Could be useful, but it's very very very slow
        'import/no-cycle': 'off',
        'import/no-anonymous-default-export': [
            'error',
            {
                allowArray: true,
                allowLiteral: true,
                allowObject: true,
            },
        ],
        // We have typescript.
        'react/prop-types': 'off',
        // It's fine.
        'react/no-multi-comp': 'off',
        'react/no-unescaped-entities': 'off',
        // This is fine.
        'class-methods-use-this': 'off',
        'lines-between-class-members': 'off',
        // We use it for immer. It should be checked by readonly anyway.
        'no-param-reassign': 'off',
        // Irrelevant.
        'no-plusplus': 'off',
        'no-return-assign': 'off',
        'consistent-return': 'off',
        'no-console': ['error', { allow: ['warn', 'error'] }],
        // TSC checks it.
        'no-undef': 'off',
        'react/jsx-no-undef': 'off',
        'react/react-in-jsx-scope': 'off',
        // React Hooks.
        'react-hooks/rules-of-hooks': 'error',
        'react-hooks/exhaustive-deps': 'error',
        // Reconsider, maybe enable later:
        '@typescript-eslint/explicit-member-accessibility': 'off',
        '@typescript-eslint/no-explicit-any': 'off',
        'react/destructuring-assignment': 'off',
        'func-names': 'off',
        'react/require-default-props': 'off',
        '@typescript-eslint/no-non-null-assertion': 'off',
        // We use this syntax
        '@typescript-eslint/triple-slash-reference': 'off',
        // new rules (eslint 6) temporary disabled until components-v2 and ts-ignore resolve
        'react/jsx-props-no-spreading': 'off',
        '@typescript-eslint/ban-ts-ignore': 'off',
        // We need empty functions for mocking modules for react-native
        '@typescript-eslint/no-empty-function': 'off',
        'no-useless-constructor': 'off',
        '@typescript-eslint/no-useless-constructor': 'error',
        // valid case of class method overloads in typescript
        'no-dupe-class-members': 'off',
        '@typescript-eslint/ban-ts-comment': 'off',
        //  Missing return type on function
        '@typescript-eslint/explicit-module-boundary-types': 'off',
        // note you must disable the base rule as it can report incorrect errors
        'no-use-before-define': 'off',
        '@typescript-eslint/no-use-before-define': ['error'],
        'require-await': ['error'],
        'react/display-name': 'off',
        'react/jsx-key': 'warn',
        'react/prefer-stateless-function': 'off', // we don't use classes at all
        'react/no-deprecated': 'off', // checked by TS
        'react/no-direct-mutation-state': 'off', // we don't use classes at all
        'react/require-render-return': 'off', // we don't use classes at all
        'react/no-is-mounted': 'off', // we don't use classes at all
        'react/jsx-indent': 'off', // we use prettier
        'prefer-destructuring': [
            'error',
            {
                VariableDeclarator: {
                    array: false,
                    object: true,
                },
                AssignmentExpression: {
                    array: false,
                    object: false,
                },
            },
            {
                enforceForRenamedProperties: false,
            },
        ],

        // Node.js
        // These rules are specific to JavaScript running on Node.js.
        'handle-callback-err': 'error', // enforces error handling in callbacks (off by default) (on by default in the node environment)
        'no-mixed-requires': 'error', // disallow mixing regular variable and require declarations (off by default) (on by default in the node environment)
        'no-new-require': 'error', // disallow use of new operator with the require function (off by default) (on by default in the node environment)
        'no-path-concat': 'error', // disallow string concatenation with __dirname and __filename (off by default) (on by default in the node environment)
        'no-process-exit': 'off', // disallow process.exit() (on by default in the node environment)
        'no-restricted-modules': 'error', // restrict usage of specified node modules (off by default)
        'no-sync': 'off', // disallow use of synchronous methods (off by default)
        'eol-last': 'error',
        'import/no-default-export': 'error',

        // Variables
        // These rules have to do with variable declarations.
        'no-label-var': 'error', // disallow labels that share a name with a variable
        'no-shadow': 'off', // @typescript-eslint/no-shadow will be used instead
        '@typescript-eslint/no-shadow': [
            'error',
            { builtinGlobals: true, allow: ['_', 'error', 'resolve', 'reject', 'fetch'] },
        ], // disallow declaration of variables already declared in the outer scope
        'no-shadow-restricted-names': 'error', // disallow shadowing of names such as arguments
        'no-undefined': 'off', // disallow use of undefined variable (off by default)
        'no-undef-init': 'error', // disallow use of undefined when initializing variables
        'no-unused-vars': 'off',
        'no-unused-expressions': 0,
        'prefer-const': 'off',
        'chai-friendly/no-unused-expressions': 2,
        '@typescript-eslint/no-unused-vars': [
            'error',
            { vars: 'all', args: 'none', ignoreRestSiblings: true, varsIgnorePattern: '^_' },
        ],
        '@typescript-eslint/no-restricted-imports': [
            'error',
            {
                paths: [{ name: '.' }, { name: '..' }, { name: '../..' }],
                patterns: ['**/libDev/src'],
            },
        ],
        'no-restricted-syntax': [
            'error',
            {
                message:
                    "Please don't use createAsyncThunk. Use createThunk from @suite-common/redux-utils instead.",
                selector: "CallExpression[callee.name='createAsyncThunk']",
            },
            {
                message:
                    'Please don\'t use getState directly. Always use strongly typed selector, because geState is typed as "any" and it\'s dangerous to use it directly.',
                selector:
                    'MemberExpression[property.type="Identifier"]:matches([object.callee.name="getState"])',
            },
            {
                message:
                    'Do not assign "getState" directly. Always use strongly typed selector, because geState is typed as "any" and it\'s dangerous to use it directly.',
                selector:
                    "VariableDeclarator[init.type='CallExpression']:matches([init.callee.name='getState'])",
            },
            {
                message:
                    'Please don\'t use "state" directly because it\'s typed as "any". Always use it only as parameter for strongly typed selector function.',
                selector:
                    "CallExpression[callee.name='useSelector'] MemberExpression[object.name='state']:matches([property.type='Identifier'])",
            },
        ],
    },
    overrides: [
        {
            files: ['**/*.js'],
            rules: {
                // JS files are usually configs or scripts where require is OK
                '@typescript-eslint/no-var-requires': 'off',
                'no-console': 'off',
            },
        },
        {
            // we are using explicit blacklist because this will enforce new rules in newly created packages
            files: [
                'packages/analytics/**/*',
                'packages/blockchain-link/**/*',
                'packages/components/**/*',
                'packages/connect/**/*',
                'packages/connect-common/**/*',
                'packages/connect-explorer/**/*',
                'packages/connect-web/**/*',
                'packages/connect-popup/**/*',
                'packages/connect-iframe/**/*',
                'packages/connect-examples/**/*',
                'packages/connect-plugin-ethereum/**/*',
                'packages/connect-plugin-stellar/**/*',
                'packages/request-manager/**/*',
                'packages/suite/**/*',
                'packages/suite-build/**/*',
                'packages/suite-data/**/*',
                'packages/suite-desktop-api/**/*',
                'packages/suite-storage/**/*',
                'packages/suite-web/**/*',
                'packages/transport/**/*',
                'packages/utxo-lib/**/*',
                'ci/scripts/**/*',
                'scripts/**/*',
                'docs/**/*',
            ],
            rules: {
                '@typescript-eslint/no-shadow': 'off',
                'import/no-default-export': 'off',
                'import/order': 'off',
                '@typescript-eslint/no-unused-vars': 'off',
                'no-console': 'off',
                'react/jsx-no-undef': 'off',
                'no-catch-shadow': 'off',
                '@typescript-eslint/no-restricted-imports': 'off',
                'no-restricted-syntax': 'off',
            },
        },
        {
            files: ['suite-native/**/*'],
            rules: {
                '@typescript-eslint/no-var-requires': 'off',
                'global-require': 'off',
            },
        },
        // tests
        {
            files: ['**/*.test.*', '**/__tests__/**/*'],
            rules: {
                'import/no-extraneous-dependencies': 'off',
                'import/no-unresolved': 'off',
                'import/no-default-export': 'off',
            },
        },
    ],
};

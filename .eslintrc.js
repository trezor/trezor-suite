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
    plugins: ['import', '@typescript-eslint', 'react-hooks', 'prettier', 'jest'],
    extends: [
        'airbnb',
        'plugin:@typescript-eslint/recommended',
        'plugin:import/typescript',
        'prettier',
    ],
    settings: {
        react: {
            version: 'detect',
        },
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
        'packages/suite-data/files/*',
        'packages/transport/scripts/protobuf-patches/*',
    ],
    overrides: [
        {
            files: ['**/*.js'],
            rules: {
                // JS files are usually configs or scripts where require is OK
                '@typescript-eslint/no-var-requires': 'off',
            },
        },
    ],
    rules: {
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
        'react/jsx-indent': [2, 4],
        // I believe shadowing is a nice language feature.
        'no-shadow': 'off',
        'import/order': 'off',
        // Does not work with TypeScript export type.
        'import/prefer-default-export': 'off',
        // Does not work with Babel react-native to react-native-web
        'import/no-unresolved': 'off',
        'import/extensions': [
            'error',
            'never',
            {
                ignorePackages: true,
                pattern: {
                    // it's nice to explicitly know we are dealing with JSON
                    json: 'always',
                },
            },
        ],
        'import/no-extraneous-dependencies': 'off',
        'import/no-cycle': 'error',
        'import/no-anonymous-default-export': [
            'error',
            {
                allowArray: true,
                allowLiteral: true,
                allowObject: true,
            },
        ],
        // We have types.
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
        'no-console': 'off',
        // TSC checks it.
        '@typescript-eslint/no-unused-vars': 'off',
        'no-undef': 'off',
        'react/jsx-no-undef': 'off',
        // React Hooks.
        'react-hooks/rules-of-hooks': 'error',
        'react-hooks/exhaustive-deps': 'error',
        // Reconsider, maybe enable later:
        '@typescript-eslint/explicit-member-accessibility': 'off',
        '@typescript-eslint/no-explicit-any': 'off',
        'react/destructuring-assignment': 'off',
        'prettier/prettier': 'warn',
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
    },
};

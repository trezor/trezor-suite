// this is basically the same eslint as in trezor-suite.
// there are few disabled rules in the end as this PR is not refactoring transport layer.

module.exports = {
    parser: '@typescript-eslint/parser',
    parserOptions: {
        project: './tsconfig.json',
    },
    plugins: ['import', '@typescript-eslint', 'prettier'],
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
        'import/extensions': ['error', 'never'],
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
        // Reconsider, maybe enable later:
        '@typescript-eslint/explicit-member-accessibility': 'off',
        '@typescript-eslint/no-explicit-any': 'off',
        'react/destructuring-assignment': 'off',
        'prettier/prettier': 'error',
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

        // todo: remove when refactoring transport layer.
        'no-underscore-dangle': 'off',
        'no-nested-ternary': 'off',
        '@typescript-eslint/no-use-before-define': 'off',
        '@typescript-eslint/ban-types': 'off',
        'require-await': 'off',
        'prefer-promise-reject-errors': 'off',
        'no-restricted-syntax': 'off',
        'no-await-in-loop': 'off',
        'func-names': 'off',
        '@typescript-eslint/no-var-requires': 'off',
    },
};

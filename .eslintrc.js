module.exports = {
    parser: '@typescript-eslint/parser',
    parserOptions: {
        ecmaVersion: 2018,
        sourceType: 'module',
        ecmaFeatures: {
            jsx: true,
            modules: true,
        },
    },
    plugins: ['import', '@typescript-eslint', 'react-hooks', 'prettier'],
    extends: [
        'airbnb',
        'plugin:@typescript-eslint/recommended',
        'plugin:import/typescript',
        'prettier',
        'prettier/babel',
        'prettier/@typescript-eslint',
        'prettier/react',
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
        // React Hooks.
        'react-hooks/rules-of-hooks': 'error',
        'react-hooks/exhaustive-deps': 'error',
        // Reconsider, maybe enable later:
        '@typescript-eslint/explicit-member-accessibility': 'off',
        '@typescript-eslint/no-explicit-any': 'off',
        'react/destructuring-assignment': 'off',
        'prettier/prettier': 'error',
        'react/require-default-props': 'off',
        '@typescript-eslint/no-non-null-assertion': 'off',
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

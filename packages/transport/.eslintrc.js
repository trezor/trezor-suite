module.exports = {
    extends: '../../.eslintrc.js',
    parserOptions: {
        project: ['./tsconfig.json'],
    },
    rules: {
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
    }
};

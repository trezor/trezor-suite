module.exports = {
    extends: '../../.eslintrc.js',
    parserOptions: {
        project: ['./tsconfig.json'],
    },
    rules: {
        'prefer-object-spread': 'off', // prefer Object.assign
        'no-underscore-dangle': 'off',
        'camelcase': 'off',
        'no-console': 'warn',
    },
    overrides: [
        {
            files: ['**/webpack/*.js'],
            rules: {
                '@typescript-eslint/no-var-requires': 'off'
            }
        },
    ],
};

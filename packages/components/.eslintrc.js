module.exports = {
    extends: '../../.eslintrc.js',
    parserOptions: {
        project: ['./tsconfig.json'],
    },
    rules: {
        // They are fine sometimes.
        'no-nested-ternary': 'off',
    },
};

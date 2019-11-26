module.exports = {
    extends: '../../.eslintrc.js',
    parserOptions: {
        project: ['./tsconfig.json'],
    },
    rules: {
        // Ripple-lib uses camel_Case
        '@typescript-eslint/camelcase': 'off',
    },
};

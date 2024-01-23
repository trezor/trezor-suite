module.exports = {
    parserOptions: {
        tsconfigRootDir: __dirname,
    },
    rules: {
        camelcase: 'off',
        'no-underscore-dangle': 'off',
        'no-console': 'warn',
    },
    ignorePatterns: ['jest.config.*.js'],
};

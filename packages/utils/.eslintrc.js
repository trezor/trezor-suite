module.exports = {
    parserOptions: {
        tsconfigRootDir: __dirname,
    },
    rules: {
        'no-console': 'warn',
        'import/no-default-export': 'error',
        'import/no-extraneous-dependencies': ['error', { devDependencies: true }],
    },
};

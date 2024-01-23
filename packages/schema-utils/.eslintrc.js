module.exports = {
    parserOptions: {
        tsconfigRootDir: __dirname,
    },
    rules: {
        'no-console': 'warn',
        'import/no-extraneous-dependencies': ['error', { devDependencies: true }],
    },
    ignorePatterns: ['**/__snapshots__/**'],
};

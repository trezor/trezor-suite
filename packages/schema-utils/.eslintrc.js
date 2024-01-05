module.exports = {
    rules: {
        'no-console': 'warn',
        'import/no-extraneous-dependencies': ['error', { devDependencies: true }],
    },
    ignorePatterns: ['**/__snapshots__/**'],
};

module.exports = {
    rules: {
        'import/no-extraneous-dependencies': [
            'error',
            { devDependencies: ['**/*.test.ts', '*config.ts'] },
        ],
    },
};

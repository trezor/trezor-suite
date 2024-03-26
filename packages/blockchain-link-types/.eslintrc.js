module.exports = {
    parserOptions: {
        tsconfigRootDir: __dirname,
    },
    rules: {
        'import/no-extraneous-dependencies': ['error', { includeTypes: true }],
    },
};

module.exports = {
    parserOptions: {
        tsconfigRootDir: __dirname,
    },
    rules: {
        '@typescript-eslint/ban-types': 'off', // allow {} in protobuf.d.ts
    },
    ignorePatterns: ['**/scripts/*'],
};

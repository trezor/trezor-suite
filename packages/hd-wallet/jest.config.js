module.exports = {
    rootDir: '.',
    testRegex: './test/.*.js$',
    collectCoverage: true,
    testPathIgnorePatterns: [
        '/node_modules/',
        '/fastxpub/',
        '/test_bitcore/',
        '/build/',
        'helper',
        'test/coinselect-lib/_utils.js',
    ],
};

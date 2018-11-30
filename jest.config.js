module.exports = {
    rootDir: '.',
    automock: false,
    coverageDirectory: '../coverage',
    collectCoverage: true,
    modulePathIgnorePatterns: [
        'node_modules',
    ],
    collectCoverageFrom: [
        'src/**.js',
    ],
    testRegex: './test/.*.js$',
};

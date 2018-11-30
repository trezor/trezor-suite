module.exports = {
    rootDir: '.',
    transform: {
        '^.+\\.(js|jsx|ts)$': 'babel-jest',
    },
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

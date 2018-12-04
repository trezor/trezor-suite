module.exports = {
    rootDir: '.',
    roots: ['src'],
    transform: {
        '^.+\\.(js|jsx|ts)$': 'babel-jest',
    },
    automock: false,
    coverageDirectory: './coverage',
    collectCoverage: true,
    modulePaths: ['src'],
    modulePathIgnorePatterns: [
        'node_modules',
    ],
    collectCoverageFrom: [
        'src/**.js',
    ],
};

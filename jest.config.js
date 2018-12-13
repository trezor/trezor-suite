module.exports = {
    rootDir: '.',
    roots: ['src'],
    transform: {
        '^.+\\.(js|jsx|ts)$': 'babel-jest',
    },
    coverageThreshold: {
        global: {
            branches: 100,
            functions: 100,
            lines: 100,
            statements: 100,
        },
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

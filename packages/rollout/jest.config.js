module.exports = {
    rootDir: '.',
    roots: ['src'],
    transform: {
        '^.+\\.(ts)$': 'ts-jest',
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
    testMatch: ['**/tests/*.ts'],
    modulePaths: ['src'],
    moduleFileExtensions: ['js', 'ts', 'json'],
    modulePathIgnorePatterns: ['node_modules'],
    collectCoverageFrom: ['src/**/*.ts'],
};
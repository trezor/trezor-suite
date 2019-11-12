module.exports = {
    rootDir: '.',
    transform: {
        '^.+\\.(ts)$': 'ts-jest',
    },
    collectCoverage: true,
    collectCoverageFrom: ['src/**/*.ts'],
    coverageDirectory: './coverage',
    coverageThreshold: {
        global: {
            branches: 100,
            functions: 100,
            lines: 100,
            statements: 100,
        },
    },
    coveragePathIgnorePatterns: [
        'src/utils/fetch.ts', // mocked in tests
    ],
    testMatch: ['**/__tests__/*.ts'],
    modulePaths: ['src'],
    moduleFileExtensions: ['js', 'ts', 'json'],
    modulePathIgnorePatterns: ['node_modules'],
    automock: false,
    globals: {
        'ts-jest': {
            // diagnostics: false,
            tsConfig: {
                target: 'esnext',
            },
        },
    },
};

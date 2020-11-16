module.exports = {
    rootDir: '.',
    transform: {
        '^.+\\.(ts)$': 'ts-jest',
    },
    setupFiles: ['<rootDir>/setupJest.ts'],
    collectCoverage: true,
    collectCoverageFrom: ['src/**/*.ts'],
    coverageDirectory: './coverage',
    coverageThreshold: {
        global: {
            branches: 95,
            functions: 100,
            lines: 98,
            statements: 97,
        },
    },
    coveragePathIgnorePatterns: [
        'src/utils/fetch.ts', // mocked in tests
    ],
    testMatch: ['**/integration/*.ts', '**/__tests__/*.ts'],
    modulePaths: ['src'],
    moduleFileExtensions: ['js', 'ts', 'json'],
    modulePathIgnorePatterns: ['node_modules', 'lib'],
    automock: false,
    preset: 'ts-jest',
    globals: {
        'ts-jest': {
            // diagnostics: false,
        },
    },
    testTimeout: 20000,
};

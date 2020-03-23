/**
 * This config contains only unit tests.
 * Does not contain coverage as it is included in e2e tests which run also unit tests
 */
module.exports = {
    rootDir: '.',
    transform: {
        '^.+\\.(ts)$': 'ts-jest',
    },
    setupFiles: ['<rootDir>/setupJest.ts'],
    testMatch: ['**/__tests__/*.ts'],
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
};

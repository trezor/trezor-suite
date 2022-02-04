module.exports = {
    rootDir: './',
    globals: {
        'ts-jest': {
            tsconfig: 'tsconfig.lib.json',
        },
    },
    moduleFileExtensions: ['js', 'ts'],
    testMatch: ['**/*.test.ts'],
    coverageDirectory: './coverage/',
    collectCoverage: true,
    collectCoverageFrom: ['**/src/**/*.ts', '!**/__tests__/**'],
    modulePathIgnorePatterns: ['node_modules'],
    transform: {
        '^.+\\.ts$': 'ts-jest',
    },
};

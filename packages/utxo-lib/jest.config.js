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
    collectCoverageFrom: ['**/src/**/*.ts'],
    modulePathIgnorePatterns: ['node_modules'],
    setupFiles: ['./tests/jest.setup.js'],
    transform: {
        '^.+\\.ts$': 'ts-jest',
    },
};

/*
 * Unit tests for source with coverage
 */

module.exports = {
    rootDir: './',
    globals: {
        'ts-jest': {
            tsconfig: 'tsconfig.json',
        },
    },
    moduleFileExtensions: ['js', 'ts', 'json'],
    testMatch: ['**/tests/unit/**/*.ts'],
    coverageDirectory: './coverage/',
    collectCoverage: true,
    collectCoverageFrom: ['**/src/**/*.ts'],
    modulePathIgnorePatterns: [
        'node_modules',
        'src/types',
        'src/ui',
        'src/utils/ws.ts',
        'fixtures',
        'unit/worker/index.ts',
        '<rootDir>/lib',
        '<rootDir>/libDev',
    ],
    setupFiles: ['./tests/setup.js'],
    transform: {
        '^.+\\.js$': 'babel-jest',
        '^.+\\.ts$': 'ts-jest',
    },
    watchPathIgnorePatterns: ['<rootDir>/libDev'],
};

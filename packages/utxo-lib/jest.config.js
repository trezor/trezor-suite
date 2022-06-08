module.exports = {
    globals: {
        'ts-jest': {
            tsconfig: 'tsconfig.lib.json',
        },
    },
    testEnvironment: 'node',
    testMatch: ['**/*.test.ts'],
    coverageDirectory: './coverage/',
    collectCoverage: true,
    collectCoverageFrom: ['**/src/**/*.ts'],
    modulePathIgnorePatterns: ['node_modules', '<rootDir>/lib', '<rootDir>/libDev'],
    setupFiles: ['./tests/jest.setup.js'],
    transform: {
        '^.+\\.ts$': 'ts-jest',
    },
};

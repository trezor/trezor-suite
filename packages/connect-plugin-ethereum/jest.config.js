module.exports = {
    globals: {
        'ts-jest': {
            tsconfig: 'tsconfig.json',
        },
    },
    testEnvironment: 'node',
    testMatch: ['**/*.test.ts'],
    coverageDirectory: './coverage/',
    collectCoverage: true,
    collectCoverageFrom: ['**/src/**/*.ts'],
    modulePathIgnorePatterns: ['node_modules', '<rootDir>/lib', '<rootDir>/libDev'],
    watchPathIgnorePatterns: ['<rootDir>/libDev'],
    testPathIgnorePatterns: ['<rootDir>/libDev'],
    transform: {
        '^.+\\.ts$': 'ts-jest',
    },
};

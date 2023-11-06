module.exports = {
    rootDir: './',
    globals: {
        'ts-jest': {
            tsconfig: 'tsconfig.json',
        },
    },
    moduleFileExtensions: ['js', 'ts'],
    testMatch: ['**/*.test.ts'],
    coverageDirectory: './coverage/',
    collectCoverage: true,
    collectCoverageFrom: ['**/src/**/*.ts', '!**/__tests__/**'],
    modulePathIgnorePatterns: ['node_modules', '<rootDir>/lib', '<rootDir>/libDev'],
    watchPathIgnorePatterns: ['<rootDir>/libDev', '<rootDir>/lib'],
    testPathIgnorePatterns: ['<rootDir>/libDev/', '<rootDir>/lib/'],
    transform: {
        '^.+\\.ts$': 'ts-jest',
    },
};

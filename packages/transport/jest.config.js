module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    testMatch: ['**/tests/*.test.ts'],
    modulePathIgnorePatterns: ['node_modules', '<rootDir>/lib', '<rootDir>/libDev'],
    collectCoverage: true,
    collectCoverageFrom: ['src/**/*.ts'],
    testPathIgnorePatterns: ['e2e'],
};

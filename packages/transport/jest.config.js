const { testPathIgnorePatterns } = require('../../jest.config.base');

module.exports = {
    preset: '../../jest.config.base.js',
    testEnvironment: 'node',
    testMatch: ['**/tests/*.test.ts'],
    modulePathIgnorePatterns: ['node_modules', '<rootDir>/lib', '<rootDir>/libDev'],
    collectCoverage: true,
    collectCoverageFrom: ['src/**/*.ts'],
    testPathIgnorePatterns: [...testPathIgnorePatterns, 'e2e'],
};

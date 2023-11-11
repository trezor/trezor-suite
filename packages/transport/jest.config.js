const { testPathIgnorePatterns, ...baseConfig } = require('../../jest.config.base');

module.exports = {
    ...baseConfig,
    testEnvironment: 'node',
    collectCoverage: true,
    collectCoverageFrom: ['src/**/*.ts'],
    testPathIgnorePatterns: [...testPathIgnorePatterns, 'e2e'],
    watchPathIgnorePatterns: ['<rootDir>/libDev', '<rootDir>/lib'],
};

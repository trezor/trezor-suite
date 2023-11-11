const { testPathIgnorePatterns, ...baseConfig } = require('../../jest.config.base');

module.exports = {
    ...baseConfig,
    testEnvironment: 'node',
    collectCoverage: true,
    setupFiles: ['<rootDir>/setupJest.ts'],
    testPathIgnorePatterns: [...testPathIgnorePatterns, 'e2e'],
};

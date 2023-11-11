const { testPathIgnorePatterns, ...baseConfig } = require('../../jest.config.base');

module.exports = {
    ...baseConfig,
    testMatch: ['**/tests/*.test.ts'],
    testPathIgnorePatterns: [...testPathIgnorePatterns, 'e2e'],
};

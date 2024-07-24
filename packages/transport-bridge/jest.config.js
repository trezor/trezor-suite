const { testPathIgnorePatterns, ...baseConfig } = require('../../jest.config.base');

module.exports = {
    ...baseConfig,
    testEnvironment: 'node',
    testPathIgnorePatterns: [...testPathIgnorePatterns, 'e2e'],
};

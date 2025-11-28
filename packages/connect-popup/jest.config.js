const { testPathIgnorePatterns, ...baseConfig } = require('../../jest.config.base');

module.exports = {
    ...baseConfig,
    collectCoverage: false,
    testPathIgnorePatterns: [...testPathIgnorePatterns, 'e2e'],
};

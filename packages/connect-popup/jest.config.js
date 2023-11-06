const { testPathIgnorePatterns, ...baseConfig } = require('../../jest.config.base');

module.exports = {
    ...baseConfig,
    collectCoverage: true,
    testPathIgnorePatterns: [...testPathIgnorePatterns, 'e2e'],
};

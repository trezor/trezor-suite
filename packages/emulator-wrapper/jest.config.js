const baseConfig = require('../../jest.config.base');

module.exports = {
    ...baseConfig,
    testPathIgnorePatterns: [...baseConfig.testPathIgnorePatterns, '/e2e/'],
};

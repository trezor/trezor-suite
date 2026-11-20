const baseConfig = require('../../jest.config.base.swc');

module.exports = {
    ...baseConfig,
    testEnvironment: '../../JestCustomEnv.js',
    // Playwright seed tests for the quarantine bot, not Jest tests.
    testPathIgnorePatterns: [...baseConfig.testPathIgnorePatterns, '/src/quarantineBot/seed/'],
};

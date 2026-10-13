const { testPathIgnorePatterns, ...baseConfig } = require('../../jest.config.base.swc');

module.exports = {
    ...baseConfig,
    testEnvironment: '../../JestCustomEnv.js',
    // The quarantine bot seeds Currents with Playwright specs; they are not Jest tests.
    testPathIgnorePatterns: [...testPathIgnorePatterns, 'src/quarantineBot/seed'],
};

const baseConfig = require('../../jest.config.base.swc');

module.exports = {
    ...baseConfig,
    testEnvironment: 'node',
    testMatch: ['<rootDir>/e2e/**/*.e2e.ts'],
    testTimeout: 90_000,
    // all suites share one emulator and one server
    maxWorkers: 1,
};

const baseConfig = require('../../jest.config.base.swc');

module.exports = {
    ...baseConfig,
    maxWorkers: 1, // runInBand
    verbose: true,
    testEnvironment: '../../JestCustomEnv.js',
    testMatch: ['**/e2e/**/*.test.ts'],
};

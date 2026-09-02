const baseConfig = require('../../jest.config.base.swc');

module.exports = {
    ...baseConfig,
    verbose: true,
    testEnvironment: '../../JestCustomEnv.js',
    testMatch: ['**/src/**/*.test.ts'],
};

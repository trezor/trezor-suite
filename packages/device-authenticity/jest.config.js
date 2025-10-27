const baseConfig = require('../../jest.config.base');

module.exports = {
    ...baseConfig,
    collectCoverage: true,
    collectCoverageFrom: ['src/**/*.ts'],
    testEnvironment: '../../JestCustomEnv.js',
};

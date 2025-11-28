const baseConfig = require('../../jest.config.base');

module.exports = {
    ...baseConfig,
    collectCoverage: false,
    collectCoverageFrom: ['src/**/*.ts'],
    testEnvironment: '../../JestCustomEnv.js',
};

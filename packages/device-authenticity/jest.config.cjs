const baseConfig = require('../../jest.config.base.swc');

module.exports = {
    ...baseConfig,
    collectCoverage: true,
    collectCoverageFrom: ['src/**/*.ts'],
    testEnvironment: '../../JestCustomEnv.js',
};

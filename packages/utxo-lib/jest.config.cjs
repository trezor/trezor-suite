const baseConfig = require('../../jest.config.base.swc');

module.exports = {
    ...baseConfig,
    testEnvironment: '../../JestCustomEnv.js',
    collectCoverage: true,
    collectCoverageFrom: ['src/**/*.ts'],
};

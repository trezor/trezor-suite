const baseConfig = require('../../jest.config.base.swc');

module.exports = {
    ...baseConfig,
    collectCoverage: true,
    collectCoverageFrom: ['src/**/*.ts', '!src/index.ts'],
    testEnvironment: '../../JestCustomEnv.js',
};

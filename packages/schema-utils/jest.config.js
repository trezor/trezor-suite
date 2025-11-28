const baseConfig = require('../../jest.config.base');

module.exports = {
    ...baseConfig,
    testEnvironment: 'node',
    collectCoverage: false,
    collectCoverageFrom: ['src/**/*.ts'],
};

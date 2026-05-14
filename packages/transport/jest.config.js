const { ...baseConfig } = require('../../jest.config.base.swc');

module.exports = {
    ...baseConfig,
    collectCoverage: true,
    collectCoverageFrom: ['src/**/*.ts'],
    watchPathIgnorePatterns: ['<rootDir>/libDev', '<rootDir>/lib'],
    testEnvironment: '../../JestCustomEnv.js',
};

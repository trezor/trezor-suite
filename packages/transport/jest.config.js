const { ...baseConfig } = require('../../jest.config.base');

module.exports = {
    ...baseConfig,
    collectCoverage: false,
    collectCoverageFrom: ['src/**/*.ts'],
    watchPathIgnorePatterns: ['<rootDir>/libDev', '<rootDir>/lib'],
    testEnvironment: '../../JestCustomEnv.js',
};

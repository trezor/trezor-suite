const { ...baseConfig } = require('../../jest.config.base');

module.exports = {
    ...baseConfig,
    testEnvironment: 'node',
    collectCoverage: true,
    collectCoverageFrom: ['src/**/*.ts'],
    watchPathIgnorePatterns: ['<rootDir>/libDev', '<rootDir>/lib'],
    testEnvironment: '../../JestCustomEnv.js',
};

const { testPathIgnorePatterns, ...baseConfig } = require('../../jest.config.base.swc');

module.exports = {
    ...baseConfig,
    testEnvironment: '../../JestCustomEnv.js',
    collectCoverage: true,
    setupFiles: ['<rootDir>/setupJest.ts'],
    testPathIgnorePatterns: [...testPathIgnorePatterns, 'e2e'],
};

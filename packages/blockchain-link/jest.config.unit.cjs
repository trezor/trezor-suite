/*
 * Unit tests for source with coverage
 */

const { testPathIgnorePatterns, ...baseConfig } = require('../../jest.config.base.swc');

module.exports = {
    ...baseConfig,
    testMatch: ['<rootDir>/src/**/*.test.ts', '!**/*.integration.test.ts'],
    collectCoverage: true,
    collectCoverageFrom: ['**/src/**/*.ts', '!**/*.test.ts', '!**/__fixtures__/**'],
    testPathIgnorePatterns: [...testPathIgnorePatterns, 'src/types', 'src/ui'],
    setupFiles: ['./setup.js'],
    testEnvironment: '../../JestCustomEnv.js',
};

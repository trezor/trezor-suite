/*
 * Unit tests for source with coverage
 */

const { testPathIgnorePatterns, ...baseConfig } = require('../../jest.config.base');

module.exports = {
    ...baseConfig,
    testMatch: ['**/tests/unit/**/*.test.ts'],
    collectCoverage: true,
    collectCoverageFrom: ['**/src/**/*.ts'],
    testPathIgnorePatterns: [...testPathIgnorePatterns, 'src/types', 'src/ui', 'fixtures'],
    setupFiles: ['./tests/setup.js'],
    testEnvironment: '../../JestCustomEnv.js',
};

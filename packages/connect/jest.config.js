const { testPathIgnorePatterns } = require('../../jest.config.base');

module.exports = {
    preset: '../../jest.config.base.js',
    testEnvironment: 'node',
    collectCoverage: true,
    setupFiles: ['<rootDir>/setupJest.ts'],
    testPathIgnorePatterns: [...testPathIgnorePatterns, 'e2e'],
};

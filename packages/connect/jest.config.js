const { testPathIgnorePatterns } = require('../../jest.config.base');

module.exports = {
    preset: '../../jest.config.base.js',
    // TODO: https://github.com/trezor/trezor-suite/issues/5319
    testEnvironment: 'jsdom',
    collectCoverage: true,
    setupFiles: ['<rootDir>/setupJest.ts'],
    testPathIgnorePatterns: [...testPathIgnorePatterns, 'e2e'],
};

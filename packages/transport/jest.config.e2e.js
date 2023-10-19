const config = require('../../jest.config.base');

module.exports = {
    ...config,
    testEnvironment: 'node',
    testMatch: ['**/e2e/tests/*.test.ts'],
    testPathIgnorePatterns: [],
};

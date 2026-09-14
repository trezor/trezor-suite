const baseConfig = require('../../jest.config.base.swc');

module.exports = {
    ...baseConfig,
    // Only the report pipeline has jest unit tests. Everything else named *.test.ts in this
    // workspace is a Playwright test — jest must never pick those up.
    testMatch: ['<rootDir>/performance/report/**/*.test.ts'],
    collectCoverage: false,
    testEnvironment: '../../JestCustomEnv.js',
};

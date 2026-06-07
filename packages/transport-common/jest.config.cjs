const { ...baseConfig } = require('../../jest.config.base.swc');

module.exports = {
    ...baseConfig,
    collectCoverage: true,
    collectCoverageFrom: ['src/**/*.ts'],
    watchPathIgnorePatterns: ['<rootDir>/libDev', '<rootDir>/lib'],
    testEnvironment: '../../JestCustomEnv.js',
    // Fuzz/property tests are randomized and slower; they run on demand via
    // `yarn test:fuzz` (jest.config.fuzz.cjs), not as part of the unit suite.
    testPathIgnorePatterns: [...baseConfig.testPathIgnorePatterns, '\\.fuzz\\.test\\.[tj]sx?$'],
};

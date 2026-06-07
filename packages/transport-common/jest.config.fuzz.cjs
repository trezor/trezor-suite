const unitConfig = require('./jest.config.cjs');

// Runs only the randomized fuzz/property tests, which are excluded from the
// default unit suite (see jest.config.cjs). Invoked via `yarn test:fuzz`.
module.exports = {
    ...unitConfig,
    collectCoverage: false,
    testMatch: ['**/*.fuzz.test.[tj]s?(x)'],
    testPathIgnorePatterns: unitConfig.testPathIgnorePatterns.filter(
        pattern => !pattern.includes('fuzz'),
    ),
};

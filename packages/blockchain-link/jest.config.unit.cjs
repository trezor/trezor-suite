/*
 * Unit tests for source with coverage
 */

const { testPathIgnorePatterns, ...baseConfig } = require('../../jest.config.base.swc');

module.exports = {
    ...baseConfig,
    testMatch: ['<rootDir>/src/**/*.test.ts'],
    collectCoverage: true,
    collectCoverageFrom: ['**/src/**/*.ts', '!**/*.test.ts', '!**/__fixtures__/**'],
    testPathIgnorePatterns: [
        ...testPathIgnorePatterns,
        'src/types',
        'src/ui',
        'fixtures',
        'src/workers/blockbook/blockbook.test.ts',
        'src/workers/blockfrost/blockfrost.test.ts',
        'src/workers/connection.test.ts',
        'src/workers/electrum/electrum.test.ts',
        'src/workers/ripple/ripple.test.ts',
        'src/workers/solana/solana.test.ts',
        'src/workers/stellar/stellar.test.ts',
    ],
    setupFiles: ['./setup.js'],
    testEnvironment: '../../JestCustomEnv.js',
};

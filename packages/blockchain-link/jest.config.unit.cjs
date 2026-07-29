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
        'src/workers/blockbook/blockbookWorker.test.ts',
        'src/workers/blockfrost/blockfrostWorker.test.ts',
        'src/workers/connection.test.ts',
        'src/workers/electrum/electrumWorker.test.ts',
        'src/workers/ripple/rippleWorker.test.ts',
        'src/workers/solana/solanaWorker.test.ts',
        'src/workers/stellar/stellarWorker.test.ts',
    ],
    setupFiles: ['./setup.js'],
    testEnvironment: '../../JestCustomEnv.js',
};

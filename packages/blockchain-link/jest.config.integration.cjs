/*
 * Integration tests for library build in `./lib` and `./build` directory
 */

const baseConfig = require('../../jest.config.base.swc');

module.exports = {
    ...baseConfig,
    moduleFileExtensions: ['js', 'ts', 'json'],
    testMatch: [
        '<rootDir>/src/workers/blockbook/blockbookWorker.test.ts',
        '<rootDir>/src/workers/blockfrost/blockfrostWorker.test.ts',
        '<rootDir>/src/workers/connection.test.ts',
        '<rootDir>/src/workers/electrum/electrumWorker.test.ts',
        '<rootDir>/src/workers/ripple/rippleWorker.test.ts',
        '<rootDir>/src/workers/solana/solanaWorker.test.ts',
        '<rootDir>/src/workers/stellar/stellarWorker.test.ts',
    ],
};

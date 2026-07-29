/*
 * Integration tests for library build in `./lib` and `./build` directory
 */

const baseConfig = require('../../jest.config.base.swc');

module.exports = {
    ...baseConfig,
    moduleFileExtensions: ['js', 'ts', 'json'],
    testMatch: [
        '<rootDir>/src/workers/blockbook/blockbook.test.ts',
        '<rootDir>/src/workers/blockfrost/blockfrost.test.ts',
        '<rootDir>/src/workers/connection.test.ts',
        '<rootDir>/src/workers/electrum/electrum.test.ts',
        '<rootDir>/src/workers/ripple/ripple.test.ts',
        '<rootDir>/src/workers/solana/solana.test.ts',
        '<rootDir>/src/workers/stellar/stellar.test.ts',
    ],
};

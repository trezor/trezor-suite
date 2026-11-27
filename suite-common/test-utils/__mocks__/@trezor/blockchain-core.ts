// Usage: like the `@trezor/connect` mock next to it, `@trezor/blockchain-core` is mocked in all
// tests of the projects listing this directory in the roots of their jest config.
// TrezorBlockchain answers through the Connect mock, so tests script backend and device calls
// with one sequence of fixtures, and `emitTestEvent` emits its events too.

import type * as BlockchainCore from '@trezor/blockchain-core';

// Read on use, as the actual Connect, which the Connect mock loads, loads this mock too.
const getConnectMock = () => require('@trezor/connect');

const call = (method: string) =>
    jest.fn((params: object) => getConnectMock().mockResponse(method, params));

// The events are plain constants, so the tests use the actual ones.
export const { BLOCKCHAIN, BLOCKCHAIN_EVENT, createBlockchainMessage, isBlockchainEventOfType } =
    jest.requireActual<typeof BlockchainCore>('@trezor/blockchain-core');

export const TrezorBlockchain = {
    updateSettings: jest.fn(() => Promise.resolve()),
    dispose: jest.fn(),
    on: (...args: unknown[]) => getConnectMock().default.on(...args),
    off: (...args: unknown[]) => getConnectMock().default.off(...args),
    removeAllListeners: jest.fn(),
    getInfo: call('getInfo'),
    getDefaultBackend: call('getDefaultBackend'),
    setCustomBackend: call('setCustomBackend'),
    registerEvmNetwork: call('registerEvmNetwork'),
    disconnect: call('disconnect'),
    subscribe: call('subscribe'),
    unsubscribe: call('unsubscribe'),
    subscribeFiatRates: call('subscribeFiatRates'),
    unsubscribeFiatRates: call('unsubscribeFiatRates'),
    getCurrentFiatRates: call('getCurrentFiatRates'),
    getFiatRatesForTimestamps: call('getFiatRatesForTimestamps'),
    getAccountBalanceHistory: call('getAccountBalanceHistory'),
    getAccountInfo: call('getAccountInfo'),
    getTransactions: call('getTransactions'),
    getRawTransactions: call('getRawTransactions'),
    getContractInfo: call('getContractInfo'),
    estimateFee: call('estimateFee'),
    estimateFeeLevels: call('estimateFeeLevels'),
    evmRpcCall: call('evmRpcCall'),
    evmRpcGetChainId: call('evmRpcGetChainId'),
    pushTransaction: call('pushTransaction'),
};

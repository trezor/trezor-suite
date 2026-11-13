// Usage: like the `@trezor/connect` mock next to it, `@trezor/blockchain-core` is mocked in all
// tests of the projects listing this directory in the roots of their jest config.
// TrezorBlockchain answers as the Connect mock answered the blockchain methods TrezorBlockchain
// took over, so tests script backend and device calls with one sequence of fixtures, and
// `emitTestEvent` emits its events too.

// Read on use, as the actual Connect, which the Connect mock loads, loads this mock too.
const getConnectMock = () => require('@trezor/connect');

const call = (method: string) =>
    jest.fn((params: object) => getConnectMock().mockResponse(method, params));

// The events are plain constants, so the tests use the actual ones; the package itself resolves to
// this mock.
export const { BLOCKCHAIN, BLOCKCHAIN_EVENT, createBlockchainMessage, isBlockchainEventOfType } =
    jest.requireActual('@trezor/blockchain-core/src/events');

export const TrezorBlockchain = {
    updateSettings: jest.fn(() => Promise.resolve()),
    dispose: jest.fn(),
    on: (...args: unknown[]) => getConnectMock().default.on(...args),
    off: (...args: unknown[]) => getConnectMock().default.off(...args),
    removeAllListeners: jest.fn(),
    getInfo: call('blockchainGetInfo'),
    getDefaultBackend: call('blockchainGetDefaultBackend'),
    setCustomBackend: call('blockchainSetCustomBackend'),
    disconnect: call('blockchainDisconnect'),
    subscribe: call('blockchainSubscribe'),
    unsubscribe: call('blockchainUnsubscribe'),
    subscribeFiatRates: call('blockchainSubscribeFiatRates'),
    unsubscribeFiatRates: call('blockchainUnsubscribeFiatRates'),
    getCurrentFiatRates: call('blockchainGetCurrentFiatRates'),
    getFiatRatesForTimestamps: call('blockchainGetFiatRatesForTimestamps'),
    getAccountBalanceHistory: call('blockchainGetAccountBalanceHistory'),
    getAccountInfo: call('getAccountInfo'),
    getTransactions: call('blockchainGetTransactions'),
    getContractInfo: call('blockchainGetContractInfo'),
    estimateFee: call('blockchainEstimateFee'),
    evmRpcCall: call('blockchainEvmRpcCall'),
    evmRpcGetChainId: call('blockchainEvmRpcGetChainId'),
    pushTransaction: call('pushTransaction'),
};

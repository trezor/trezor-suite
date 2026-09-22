// Usage:
// **make sure that mock files are listed in project jest.config file**
// roots: ['<rootDir>/src', '<rootDir>/../test-utils/__mocks__']
// `'@trezor/connect` module will be automatically mocked in all tests
// https://jestjs.io/docs/manual-mocks#mocking-node-modules

import {
    CallMethodPayload,
    TrezorConnectCallable,
    TrezorConnectPrivilegedAPI,
    connectCallableMethods,
} from '@trezor/connect';
import { typedObjectFromEntries } from '@trezor/utils';

const connect = jest.requireActual('@trezor/connect');

// event listeners
const listeners: Record<string, (e: any) => void> = {};
// methods response fixtures
let fixtures: Record<string, any> | Record<string, any>[] | undefined;
const getNextFixture = () => {
    const fixture = Array.isArray(fixtures) ? fixtures.shift() : fixtures;
    if (typeof fixture === 'function') return fixture();

    return fixture;
};

const ERROR_RESULT = { success: false, error: { message: 'Default mock error' } };

// Override connect methods with mocked default response (success: true)
const failedByDefaultMethods = [
    'getAccountInfo',
    'getOwnershipProof',
    'authenticateDevice',
    'authorizeCoinjoin',
    'signTransaction',
    'ethereumSignTransaction',
    'rippleSignTransaction',
];

// Background reads fired by display features rather than by the sequence a test scripts. Taking a
// positional fixture would shift every later call, so adding one such feature would break every
// test that scripts a device interaction. They are answered from DEFAULT_PAYLOAD alone.
const unscriptedMethods = ['blockchainEvmRpcCall'];

// Override connect methods with specific expected payload
const DEFAULT_PAYLOAD: Record<string, any> = {
    blockchainEstimateFee: { payload: { levels: [{}] } },
    // A revert is how a resolver declines: it reads as "no record" rather than a transport
    // failure, so a name lookup settles on it instead of retrying.
    blockchainEvmRpcCall: { success: false, error: { message: 'execution reverted' } },
    blockchainGetTransactions: { payload: { txid: 'foo' } },
    pushTransaction: { payload: { txid: 'txid' } },
    unlockPath: { payload: { address_n: [2147493673], mac: '0MaC' } },
    changePin: { payload: { message: 'Success' } },
};

const mockResponse = (method: string, params: any) => {
    const fixture = unscriptedMethods.includes(method) ? undefined : getNextFixture();
    const response = {
        success: true,
        payload: { _comment: 'Default mock payload' },
        ...(failedByDefaultMethods.includes(method) ? ERROR_RESULT : DEFAULT_PAYLOAD[method]),
        ...fixture,
        _method: method,
        _fixtures: fixtures,
        _params: params,
    };

    // A fixture may keep the call pending, so a test can interleave UI events while it is in flight
    // (same convention as `composeTransaction`). Plain fixtures resolve synchronously as before.
    return fixture && typeof fixture.delay === 'number'
        ? new Promise(resolve => setTimeout(() => resolve(response), fixture.delay))
        : Promise.resolve(response);
};

const init = (params: any): Promise<void> => mockResponse('init', params);

// Methods whose real implementation sets `this.useDevice = false` (backend-only). The device-lock
// wrapper in connectInitThunks asks Connect via an `__info` probe whether a call touches the device;
// the real Connect answers from the constructed method, but here Connect is mocked, so this stands
// in for that knowledge. Mirror `packages/connect-core/src/api/*` — keep in step when it changes.
const backendOnlyMethods = new Set([
    'blockchainDisconnect',
    'blockchainEstimateFee',
    'blockchainEvmRpcCall',
    'blockchainEvmRpcGetChainId',
    'blockchainGetAccountBalanceHistory',
    'blockchainGetContractInfo',
    'blockchainGetCurrentFiatRates',
    'blockchainGetFiatRatesForTimestamps',
    'blockchainGetInfo',
    'blockchainGetTransactions',
    'blockchainSetCustomBackend',
    'blockchainSubscribe',
    'blockchainSubscribeFiatRates',
    'blockchainUnsubscribe',
    'blockchainUnsubscribeFiatRates',
    'cardanoComposeTransaction',
    'composePsbt',
    'composeTransaction',
    'getCoinInfo',
    'getSettings',
    'pushTransaction',
    'selectAccount',
    'solanaComposeTransaction',
    'tronComposeTransaction',
]);

// getAccountInfo derives the xpub on the device only without a descriptor; thpRemoveCredentials
// touches the device only when one is addressed — mirroring their real constructors.
const accountInfoBatchUsesDevice = (batch: any) =>
    batch?.path !== undefined && typeof batch?.descriptor !== 'string';

const probeUsesDevice = (params: any): boolean => {
    if (backendOnlyMethods.has(params.method)) return false;
    if (params.method === 'getAccountInfo') {
        return params.bundle
            ? params.bundle.some(accountInfoBatchUsesDevice)
            : accountInfoBatchUsesDevice(params);
    }
    if (params.method === 'thpRemoveCredentials') return params.device !== undefined;

    return true;
};

const call = (params: CallMethodPayload) => {
    // An `__info` probe asks only whether the method needs the device; core answers it from the
    // constructed method before touching a device or backend. Mirror that here, and crucially do
    // NOT consume a positional response fixture, so probing never shifts a scripted call sequence.
    if (params.__info) {
        const useDevice = probeUsesDevice(params);

        return Promise.resolve({
            success: true,
            payload: {
                name: params.method,
                useDevice,
                useDeviceState: useDevice,
                useUi: useDevice,
                requiredPermissions: [],
            },
            _method: params.method,
            _params: params,
        });
    }

    return mockResponse(params.method, params);
};

const on = jest.fn((event: string, cb) => (listeners[event] = cb));

const off = jest.fn((event: string) => delete listeners[event]);

const composeTransaction = jest.fn(async _params => {
    const fixture = getNextFixture();
    if (fixture && typeof fixture.delay === 'number') {
        await new Promise(resolve => setTimeout(resolve, fixture.delay));
    }

    return { success: false, error: { message: 'error' }, ...fixture, _params };
});

const mock: TrezorConnectPrivilegedAPI = {
    init,
    call,
    on,
    off,
    cancel: () => {},
    dispose: () => {},
    removeAllListeners: () => {},
    uiResponse: () => {},
    updateConnectSettings: () =>
        Promise.resolve({ success: true, payload: { message: 'success' } } as const),
    ...(typedObjectFromEntries(
        connectCallableMethods.map(method => [
            method,
            jest.fn().mockImplementation((params: any) => mock.call({ ...params, method })),
        ]),
    ) as TrezorConnectCallable),
    composeTransaction,
};

// Add custom methods
const emitTestEvent = (event: string, data: any) =>
    listeners[event]?.call(undefined, { event, ...data });

const setTestFixtures = (f?: typeof fixtures) => {
    fixtures = f;
};

module.exports = {
    __esModule: true,
    ...connect,
    default: mock,
    setTestFixtures,
    emitTestEvent,
};

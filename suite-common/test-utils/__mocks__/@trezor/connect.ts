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

const mockResponse = (method: string, params: any) =>
    Promise.resolve({
        success: true,
        payload: { _comment: 'Default mock payload' },
        ...(failedByDefaultMethods.includes(method) ? ERROR_RESULT : DEFAULT_PAYLOAD[method]),
        ...(unscriptedMethods.includes(method) ? undefined : getNextFixture()),
        _method: method,
        _fixtures: fixtures,
        _params: params,
    });

const init = (params: any): Promise<void> => mockResponse('init', params);

const call = (params: CallMethodPayload) => {
    if (params?.__info) {
        connect.default.init({
            manifest: {
                email: 'email@trezor.io',
                appUrl: 'https://trezor.io',
                appName: 'Test App',
            },
        });

        // call actual implementation
        return connect.default[params.method](params).finally(() => {
            // I needed to call dispose to get rid of 'Jest did not exit one second after the test run has completed.' warning
            connect.default.dispose();
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

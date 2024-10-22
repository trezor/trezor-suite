// Usage:
// **make sure that mock files are listed in project jest.config file**
// roots: ['<rootDir>/src', '<rootDir>/../test-utils/__mocks__']
// `'@trezor/connect` module will be automatically mocked in all tests
// https://jestjs.io/docs/manual-mocks#mocking-node-modules

const connect = jest.requireActual('@trezor/connect');

// event listeners
const listeners: Record<string, (e: any) => void> = {};
// methods response fixtures
let fixtures: Record<string, any> | Record<string, any>[] | undefined;
const getNextFixture = (_methodName: string) => {
    const fixture = Array.isArray(fixtures) ? fixtures.shift() : fixtures;
    if (typeof fixture === 'function') return fixture();

    return fixture;
};

const result = (methodName: string, data: any) =>
    jest.fn(params =>
        Promise.resolve({
            success: true,
            payload: { _comment: 'Default mock payload' },
            ...data,
            ...getNextFixture(methodName),
            _method: methodName,
            _fixtures: fixtures,
            _params: params,
        }),
    );

const ERROR_RESULT = { success: false, payload: { error: 'Default mock error' } };

// Override connect methods with mocked default response (success: true)
const methods = connect.default;
const failedByDefaultMethods = [
    'getAccountInfo',
    'getOwnershipProof',
    'authenticateDevice',
    'authorizeCoinjoin',
    'signTransaction',
    'ethereumSignTransaction',
    'rippleSignTransaction',
];

// Override connect methods with specific expected payload
const DEFAULT_PAYLOAD: Record<string, any> = {
    blockchainEstimateFee: { payload: { levels: [{}] } },
    blockchainGetTransactions: { payload: { txid: 'foo' } },
    pushTransaction: { payload: { txid: 'txid' } },
    unlockPath: { payload: { address_n: [2147493673], mac: '0MaC' } },
    changePin: { payload: { message: 'Success' } },
};

Object.keys(methods).forEach(methodName => {
    if (typeof methods[methodName] === 'function') {
        const failed = failedByDefaultMethods.includes(methodName)
            ? ERROR_RESULT
            : DEFAULT_PAYLOAD[methodName];
        methods[methodName] = result(methodName, failed);
    }
});

// Override connect methods with custom implementation
methods.on = jest.fn((event: string, cb) => {
    listeners[event] = cb;
});
methods.off = jest.fn((event: string, _cb) => {
    delete listeners[event];
});
methods.composeTransaction = jest.fn(async _params => {
    const fixture = getNextFixture('composeTransaction');
    if (fixture && typeof fixture.delay === 'number') {
        await new Promise(resolve => setTimeout(resolve, fixture.delay));
    }

    return { success: false, payload: { error: 'error' }, ...fixture, _params };
});

// Add custom methods
const emitTestEvent = (event: string, data: any) => {
    listeners[event].call(undefined, {
        event,
        ...data,
    });
};

const setTestFixtures = (f?: typeof fixtures) => {
    fixtures = f;
};

module.exports = {
    __esModule: true,
    ...connect,
    default: methods,
    setTestFixtures,
    emitTestEvent,
};

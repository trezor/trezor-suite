import type {
    CallMethodPayload,
    TrezorConnectCallable,
    TrezorConnectPrivilegedAPI,
} from '@trezor/connect';
import { typedObjectFromEntries } from '@trezor/utils';

// The callable-method list is a runtime value; read it from the real module rather than the auto-mock
// so this factory can back the `@trezor/connect` manual mock without a circular initialization.
const { connectCallableMethods } = jest.requireActual('@trezor/connect');

// A fixture is either a response object or a function producing one (used to throw on demand); the
// instance can hold a single fixture or a queue that later calls shift off in order.
type Fixture = Record<string, any> | (() => any);
type Fixtures = Fixture | Fixture[] | undefined;

export type MockTrezorConnect = jest.Mocked<TrezorConnectPrivilegedAPI> & {
    setTestFixtures: (fixtures?: Fixtures) => void;
    emitTestEvent: (event: string, data: any) => void;
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

// Builds a self-contained mocked Connect instance: its event listeners and response fixtures live in
// this closure, so a test that injects the instance via DI gets full isolation instead of sharing one
// module singleton. The callable methods route through `instance.call` read at call time, so a consumer
// that reassigns `.call` (as connectInitThunk does to wrap it) is observed by those methods.
export const createMockTrezorConnect = (): MockTrezorConnect => {
    // event listeners
    const listeners: Record<string, (e: any) => void> = {};
    // methods response fixtures
    let fixtures: Fixtures;

    const getNextFixture = () => {
        const fixture = Array.isArray(fixtures) ? fixtures.shift() : fixtures;
        if (typeof fixture === 'function') return fixture();

        return fixture;
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

    const composeTransaction = jest.fn(async (_params: any) => {
        const fixture = getNextFixture();
        if (fixture && typeof fixture.delay === 'number') {
            await new Promise(resolve => setTimeout(resolve, fixture.delay));
        }

        return { success: false, error: { message: 'error' }, ...fixture, _params };
    });

    const instance: MockTrezorConnect = {
        init: (params: any): Promise<void> => mockResponse('init', params),
        call: (params: CallMethodPayload) => mockResponse(params.method, params),
        on: jest.fn((event: string, cb) => (listeners[event] = cb)),
        off: jest.fn((event: string) => delete listeners[event]),
        cancel: () => {},
        dispose: () => {},
        removeAllListeners: () => {},
        uiResponse: () => {},
        updateConnectSettings: () =>
            Promise.resolve({ success: true, payload: { message: 'success' } } as const),
        ...(typedObjectFromEntries(
            connectCallableMethods.map((method: keyof TrezorConnectCallable) => [
                method,
                jest.fn().mockImplementation((params: any) => instance.call({ ...params, method })),
            ]),
        ) as TrezorConnectCallable),
        composeTransaction,
        emitTestEvent: (event: string, data: any) =>
            listeners[event]?.call(undefined, { event, ...data }),
        setTestFixtures: (f?: Fixtures) => {
            fixtures = f;
        },
        // Route through `unknown`: the callable methods are `jest.fn()`s widened to `TrezorConnectCallable`,
        // so this literal is a plain-function shape that does not structurally overlap with the
        // `jest.Mocked` MockInstance members `MockTrezorConnect` declares. At runtime each method is a real
        // `jest.fn()`, which is what consumers spy on (`.mock.calls`), so the double assertion is sound.
    } as unknown as MockTrezorConnect;

    return instance;
};

import { type Middleware, type UnknownAction, combineReducers } from '@reduxjs/toolkit';

import { type AnalyticsDep } from '@suite-common/analytics';
import { type DeviceReducerState, deviceInitialState } from '@suite-common/device';
import { type NetworksRootState, type NetworksState } from '@suite-common/networks';
import { type LockDevice, type LockDeviceDep } from '@suite-common/suite-types';
import { mockSuiteDevice } from '@suite-common/suite-types/mocks';
import { type TestCompositionStore, createTestCompositionRoot } from '@suite-common/test-utils';
import {
    type AccountsRootState,
    accountsActions,
    accountsInitialState,
} from '@suite-common/wallet-core';
import { type PrecomposedTransactionFinal } from '@suite-common/wallet-types';
import TrezorConnect, { type CardanoPublicKey, type PrecomposeParams } from '@trezor/connect';
import { TypedError, serializeError } from '@trezor/connect-common/src/constants/errors';
import { mock, mockNotExpected } from '@trezor/dependency-injection';
import { mockActionType } from '@trezor/redux-utils/mocks';

import { connectPopupActions } from './connectPopupActions';
import { getPermissionDeferred, getPopupCallDeferred } from './connectPopupPromiseManager';
import {
    prepareConnectPopupReducer,
    selectConnectPopupCall,
    selectConnectPopupCallWithState,
} from './connectPopupReducer';
import {
    type ConnectPopupCallThunkDeps,
    type ConnectPopupCallThunkState,
    connectPopupCallInnerThunk,
    connectPopupCallThunk,
    connectPopupFinishCallThunk,
} from './connectPopupThunks';
import { type ConnectCallSource, UNKNOWN_PROCESS } from './connectPopupTypes';
import { getMethodDefinition } from './methods';
import { connectPopupResolveSelectAccountThunk } from './methods/selectAccount/selectAccountThunks';
import {
    type ConnectPopupMethodDefinition,
    type ConnectPopupMethodKey,
    type ConnectPopupMethodRegistry,
} from './methods/types';

// Passes through to the real registry unless a test swaps in its own definitions.
jest.mock('./methods', () => {
    const actual = jest.requireActual('./methods');

    return { ...actual, getMethodDefinition: jest.fn(actual.getMethodDefinition) };
});

jest.mock('@trezor/connect', () => ({
    ...jest.requireActual('@trezor/connect'),
    __esModule: true,
    default: {
        call: jest.fn(),
        pushTransaction: jest.fn(),
        updateConnectSettings: jest.fn(),
    },
}));

const fakeDevice = mockSuiteDevice({
    connected: true,
    path: '1',
    instance: 0,
    state: undefined,
    useEmptyPassphrase: true,
});
const fakeDeviceState: DeviceReducerState = { ...deviceInitialState, selectedDevice: fakeDevice };

const connectPopupReducer = prepareConnectPopupReducer({
    actionTypes: { storageLoad: mockActionType('storageLoad') },
});

type CallThunkTestState = ConnectPopupCallThunkState & AccountsRootState & NetworksRootState;

type AnalyticsService = AnalyticsDep['analytics'];

type CallThunkTestStore = TestCompositionStore<CallThunkTestState, ConnectPopupCallThunkDeps>;

// Reacts to the popup UI the way a user would.
type SimulatedUser = (action: UnknownAction, store: CallThunkTestStore) => void;

type MethodStep<
    M extends ConnectPopupMethodKey,
    K extends keyof ConnectPopupMethodDefinition<M>,
> = NonNullable<ConnectPopupMethodDefinition<M>[K]>;

type SigningCase = {
    method: string;
    symbol: string;
    precomposed?: PrecomposedTransactionFinal;
    createCall: () => ReturnType<typeof connectPopupCallThunk>;
};

type MockConnectCallParams = {
    response: unknown;
    precomposed?: PrecomposedTransactionFinal;
};

const HARDENED = 0x80000000;

const desktopSource: ConnectCallSource = {
    type: 'desktop-ws',
    origin: 'https://app.example',
    process: UNKNOWN_PROCESS,
    manifest: { appName: 'App' },
};

const connectV9DesktopSource: ConnectCallSource = {
    type: 'desktop-ws',
    origin: 'https://app.example',
    process: UNKNOWN_PROCESS,
    manifest: { appName: 'App', npmVersion: '9.4.2' },
};

const bitcoinPrecomposedTx: PrecomposedTransactionFinal = {
    type: 'final',
    inputs: [
        {
            address_n: [84 + HARDENED, HARDENED, HARDENED, 0, 0],
            prev_hash: 'ab'.repeat(32),
            prev_index: 0,
            amount: '2000',
            script_type: 'SPENDWITNESS',
        },
    ],
    outputs: [{ address: 'bc1qrecipient', amount: '1000', script_type: 'PAYTOADDRESS' }],
    outputsPermutation: [0],
    totalSpent: '1200',
    fee: '200',
    feePerByte: '2',
    bytes: 100,
};

const ethereumPrecomposedTx: PrecomposedTransactionFinal = {
    type: 'final',
    inputs: [],
    outputs: [{ address: '0x0', amount: '0', script_type: 'PAYTOADDRESS' }],
    outputsPermutation: [0],
    totalSpent: '21000',
    fee: '21000',
    feePerByte: '1',
    bytes: 0,
};

const mockedGetMethodDefinition = jest.mocked(getMethodDefinition);
const actualGetMethodDefinition = mockedGetMethodDefinition.getMockImplementation()!;

const mockMethodDefinitions = (definitions: ConnectPopupMethodRegistry) =>
    mockedGetMethodDefinition.mockImplementation(
        // The registry type cannot correlate an entry with its key.
        (method => definitions[method]) as typeof getMethodDefinition,
    );

const mockedConnectCall = jest.mocked(TrezorConnect.call);
const mockedPushTransaction = jest.mocked(TrezorConnect.pushTransaction);

// `__info` describes the method; every other call is the device call and returns `response`.
const mockConnectCall = ({ response, precomposed }: MockConnectCallParams) => {
    mockedConnectCall.mockImplementation(params =>
        Promise.resolve(
            '__info' in params && params.__info
                ? {
                      success: true,
                      payload: {
                          info: 'Method title',
                          useUi: true,
                          requiredPermissions: [],
                          precomposed,
                      },
                  }
                : response,
        ),
    );
};

const getInfoCallParams = () =>
    mockedConnectCall.mock.calls.map(([params]) => params).filter(params => '__info' in params);

const getDeviceCallParams = () =>
    mockedConnectCall.mock.calls.map(([params]) => params).filter(params => !('__info' in params));

const getActionTypes = (store: CallThunkTestStore) => store.getActions().map(({ type }) => type);

// Approves the permission request the way the permissions modal does.
const approvePermissions: SimulatedUser = (action, store) => {
    if (connectPopupActions.requestPermissions.match(action)) {
        setTimeout(() => store.dispatch(connectPopupActions.approvePermissions()));
    }
};

// The address confirmation creates its deferred right after the dispatch, hence the next tick.
const approveAndConfirmAddresses: SimulatedUser = (action, store) => {
    approvePermissions(action, store);

    if (connectPopupActions.confirmAddresses.match(action) && !action.payload.exported) {
        setTimeout(() => getPermissionDeferred().resolve());
    }
};

const approveAndConfirmSelectedAccounts: SimulatedUser = (action, store) => {
    approvePermissions(action, store);

    if (connectPopupActions.selectAccount.match(action)) {
        setTimeout(() =>
            store.dispatch(connectPopupResolveSelectAccountThunk({ confirmed: true })),
        );
    }
};

// `Analytics` is an interface, so it cannot be mocked with createMockDeps.
const createCallThunkServices = (): AnalyticsDep & LockDeviceDep => ({
    analytics: {
        init: mockNotExpected<AnalyticsService['init']>('analytics.init'),
        enable: mockNotExpected<AnalyticsService['enable']>('analytics.enable'),
        disable: mockNotExpected<AnalyticsService['disable']>('analytics.disable'),
        isEnabled: mockNotExpected<AnalyticsService['isEnabled']>('analytics.isEnabled'),
        setUrl: mockNotExpected<AnalyticsService['setUrl']>('analytics.setUrl'),
        setLoggerEnabled: mockNotExpected<AnalyticsService['setLoggerEnabled']>(
            'analytics.setLoggerEnabled',
        ),
        report: mock<AnalyticsService['report']>(),
    },
    lockDevice: mock<LockDevice>(),
});

const initCallStore = (simulatedUser: SimulatedUser = approvePermissions) => {
    // The middleware is created before the store it reacts to.
    const storeRef: { current?: CallThunkTestStore } = {};

    const simulatedUserMiddleware: Middleware = () => next => action => {
        const result = next(action);
        if (storeRef.current) simulatedUser(action as UnknownAction, storeRef.current);

        return result;
    };

    storeRef.current = createTestCompositionRoot<ConnectPopupCallThunkDeps, CallThunkTestState>({
        services: () => createCallThunkServices(),
        reducer: combineReducers({
            connectPopup: connectPopupReducer,
            device: (state = fakeDeviceState) => state,
            wallet: (state = { accounts: accountsInitialState }) => state,
            networks: (state: NetworksState = null) => state,
        }),
        middleware: [simulatedUserMiddleware],
    }).services.store;

    return storeRef.current;
};

describe('connectPopupFinishCallThunk', () => {
    it('answers a call that ended with a device error when its popup is closed', async () => {
        const store = initCallStore();
        store.dispatch(
            connectPopupActions.initiateCall({
                method: 'getFeatures',
                methodInfo: { methodTitle: 'Method title', permissionTypes: [], useUi: true },
                payload: {},
                source: desktopSource,
            }),
        );
        const deferred = getPopupCallDeferred(true);
        const error = serializeError(TypedError('Device_Disconnected'));
        store.dispatch(connectPopupActions.setError(error));

        store.dispatch(connectPopupFinishCallThunk());

        await expect(deferred.promise).resolves.toEqual({ success: false, error });
        expect(selectConnectPopupCall(store.getState())?.state).toBe('finished');
    });
});

describe('connectPopupCallThunk — per-method popup behavior', () => {
    beforeEach(() => {
        mockedConnectCall.mockReset();
        mockedPushTransaction.mockReset();
    });

    it('calls a method without popup-specific behavior unchanged and finishes the call', async () => {
        mockConnectCall({ response: { success: true, payload: { model: 'T3T1' } } });
        const store = initCallStore();

        const response = getPopupCallDeferred(true).promise;
        await store.dispatch(
            connectPopupCallThunk({ method: 'getFeatures', payload: {}, source: desktopSource }),
        );

        await expect(response).resolves.toMatchObject({
            success: true,
            payload: { model: 'T3T1' },
        });
        expect(getDeviceCallParams()).toEqual([
            {
                device: { path: '1', instance: 0, state: undefined, useEmptyPassphrase: true },
                method: 'getFeatures',
            },
        ]);
        expect(getActionTypes(store)).toContain(connectPopupActions.finishCall.type);
    });

    it('hides the address on device, shows it in the popup and keeps the call open until confirmed', async () => {
        mockConnectCall({ response: { success: true, payload: { address: 'bc1qexported' } } });
        const store = initCallStore(approveAndConfirmAddresses);

        const response = getPopupCallDeferred(true).promise;
        await store.dispatch(
            connectPopupCallThunk({
                method: 'getAddress',
                payload: { path: "m/84'/0'/0'/0/0", coin: 'btc' },
                source: desktopSource,
            }),
        );

        await expect(response).resolves.toMatchObject({
            success: true,
            payload: { address: 'bc1qexported' },
        });
        expect(getDeviceCallParams()).toEqual([
            expect.objectContaining({ method: 'getAddress', showOnTrezor: false }),
        ]);
        expect(
            selectConnectPopupCallWithState(store.getState(), 'address-confirmation'),
        ).toMatchObject({
            exported: true,
            addresses: [{ address: 'bc1qexported', validated: 'not-started' }],
        });
        expect(getActionTypes(store)).not.toContain(connectPopupActions.finishCall.type);
    });

    it('redirects the interactive flow of a legacy composeTransaction to sendTransaction', async () => {
        mockConnectCall({ response: { success: true, payload: { serializedTx: 'aa' } } });
        const store = initCallStore();

        const response = getPopupCallDeferred(true).promise;
        await store.dispatch(
            connectPopupCallThunk({
                method: 'composeTransaction',
                // Legacy payloads are no longer part of the typed API.
                payload: {
                    coin: 'btc',
                    outputs: [{ address: 'bc1qrecipient', amount: '1000' }],
                } as unknown as PrecomposeParams,
                source: desktopSource,
            }),
        );

        await expect(response).resolves.toMatchObject({ success: true });
        expect(getInfoCallParams()).toEqual([
            expect.objectContaining({ method: 'sendTransaction' }),
        ]);
        expect(getDeviceCallParams()).toEqual([
            expect.objectContaining({ method: 'sendTransaction', coin: 'btc' }),
        ]);
    });

    it('normalizes the legacy account param of composeTransaction', async () => {
        mockConnectCall({ response: { success: true, payload: [] } });
        const store = initCallStore();
        const utxo = [{ txid: 'ab'.repeat(32), vout: 0, amount: '2000' }];

        await store.dispatch(
            connectPopupCallThunk({
                method: 'composeTransaction',
                // Legacy payloads are no longer part of the typed API.
                payload: {
                    coin: 'btc',
                    outputs: [{ address: 'bc1qrecipient', amount: '1000' }],
                    account: {
                        path: "m/84'/0'/0'",
                        utxo,
                        addresses: {
                            used: [],
                            unused: [],
                            change: [
                                { path: "m/84'/0'/0'/1/0", address: 'bc1qchange', transfers: 0 },
                            ],
                        },
                    },
                } as unknown as PrecomposeParams,
                source: desktopSource,
            }),
        );

        const [deviceCallParams] = getDeviceCallParams();
        expect(deviceCallParams).toMatchObject({
            method: 'composeTransaction',
            path: "m/84'/0'/0'",
            utxo,
            changeAddress: { address: 'bc1qchange' },
        });
        expect(deviceCallParams).not.toHaveProperty('account');
    });

    it('signs a login challenge for the origin of the calling app', async () => {
        mockConnectCall({ response: { success: true, payload: { signature: 'sig' } } });
        const store = initCallStore();

        await store.dispatch(
            connectPopupCallThunk({
                method: 'requestLogin',
                payload: { challengeHidden: 'hidden', challengeVisual: 'Login' },
                source: desktopSource,
            }),
        );

        expect(getDeviceCallParams()).toEqual([
            expect.objectContaining({ method: 'requestLogin', origin: 'https://app.example' }),
        ]);
    });

    it('restores the v9 getPublicKey fallback for apps on connect 9.x', async () => {
        mockConnectCall({
            response: { success: true, payload: { xpub: 'xpub', displayablePublicKey: 'xpub' } },
        });
        const store = initCallStore(approveAndConfirmAddresses);

        await store.dispatch(
            connectPopupCallThunk({
                method: 'getPublicKey',
                payload: { path: "m/44'/195'/0'/0/0", coin: 'trx' },
                source: connectV9DesktopSource,
            }),
        );

        expect(getInfoCallParams()).toEqual([expect.objectContaining({ _v9_compat: true })]);
        expect(getDeviceCallParams()).toEqual([
            expect.objectContaining({ _v9_compat: true, showOnTrezor: false }),
        ]);
    });

    it('returns the extended cardano key as publicKey to apps on connect 9.x after the confirmation', async () => {
        const cardanoPublicKey = {
            publicKey: 'raw-public-key',
            xpub: 'cardano-xpub',
            displayablePublicKey: 'cardano-xpub',
        } as CardanoPublicKey;
        mockConnectCall({ response: { success: true, payload: cardanoPublicKey } });

        let publicKeyDuringConfirmation: string | undefined;
        const store = initCallStore((action, testStore) => {
            if (connectPopupActions.confirmAddresses.match(action) && !action.payload.exported) {
                publicKeyDuringConfirmation = cardanoPublicKey.publicKey;
            }
            approveAndConfirmAddresses(action, testStore);
        });

        const response = getPopupCallDeferred(true).promise;
        await store.dispatch(
            connectPopupCallThunk({
                method: 'cardanoGetPublicKey',
                payload: { path: "m/1852'/1815'/0'" },
                source: connectV9DesktopSource,
            }),
        );

        await expect(response).resolves.toMatchObject({
            success: true,
            payload: { publicKey: 'cardano-xpub' },
        });
        expect(publicKeyDuringConfirmation).toBe('raw-public-key');
    });

    it('opens the account picker and returns the selection once confirmed', async () => {
        mockConnectCall({ response: { success: true, payload: [] } });
        const store = initCallStore(approveAndConfirmSelectedAccounts);

        const response = getPopupCallDeferred(true).promise;
        await store.dispatch(
            connectPopupCallThunk({
                method: 'selectAccount',
                payload: { coin: 'eth' },
                source: desktopSource,
            }),
        );

        await expect(response).resolves.toEqual({ success: true, payload: [] });
        expect(selectConnectPopupCallWithState(store.getState(), 'select-account')).toMatchObject({
            exported: true,
            options: { symbol: 'eth' },
        });
        expect(getActionTypes(store)).not.toContain(connectPopupActions.finishCall.type);
    });

    it('rejects selectAccount for a coin the host cannot render before asking for permissions', async () => {
        mockConnectCall({ response: { success: true, payload: [] } });
        const store = initCallStore();

        const response = getPopupCallDeferred(true).promise;
        await store.dispatch(
            connectPopupCallThunk({
                method: 'selectAccount',
                // A coin Connect supports but Suite has no network for.
                payload: { coin: 'firo' },
                source: desktopSource,
            }),
        );

        await expect(response).resolves.toMatchObject({
            success: false,
            error: { code: 'Method_UnsupportedCoinForHost' },
        });
        expect(getActionTypes(store)).not.toContain(connectPopupActions.requestPermissions.type);
        expect(getDeviceCallParams()).toEqual([]);
    });

    it('signs a bitcoin transaction without push and pushes it afterwards', async () => {
        mockConnectCall({
            response: { success: true, payload: { signatures: [], serializedTx: 'signed-tx' } },
        });
        mockedPushTransaction.mockResolvedValue({ success: true, payload: { txid: 'txid' } });
        const store = initCallStore();

        const response = getPopupCallDeferred(true).promise;
        await store.dispatch(
            connectPopupCallThunk({
                method: 'signTransaction',
                payload: { coin: 'btc', inputs: [], outputs: [], push: true },
                source: desktopSource,
            }),
        );

        await expect(response).resolves.toMatchObject({
            success: true,
            payload: { serializedTx: 'signed-tx' },
        });
        expect(getDeviceCallParams()).toEqual([
            expect.objectContaining({ method: 'signTransaction', push: false }),
        ]);
        expect(mockedPushTransaction).toHaveBeenCalledWith({
            coin: 'btc',
            identity: undefined,
            tx: 'signed-tx',
        });
    });

    it.each<SigningCase>([
        {
            method: 'signTransaction',
            symbol: 'btc',
            precomposed: bitcoinPrecomposedTx,
            createCall: () =>
                connectPopupCallThunk({
                    method: 'signTransaction',
                    payload: { coin: 'btc', inputs: [], outputs: [] },
                    source: desktopSource,
                }),
        },
        {
            method: 'ethereumSignTransaction',
            symbol: 'eth',
            precomposed: ethereumPrecomposedTx,
            createCall: () =>
                connectPopupCallThunk({
                    method: 'ethereumSignTransaction',
                    payload: {
                        path: "m/44'/60'/0'/0/0",
                        transaction: {
                            to: '0x0',
                            value: '0x0',
                            gasLimit: '0x5208',
                            gasPrice: '0x1',
                            nonce: '0x0',
                            chainId: 1,
                        },
                    },
                    source: desktopSource,
                }),
        },
        {
            method: 'ethereumSignTypedData',
            symbol: 'eth',
            createCall: () =>
                connectPopupCallThunk({
                    method: 'ethereumSignTypedData',
                    payload: {
                        path: "m/44'/60'/0'/0/0",
                        metamask_v4_compat: true,
                        data: {
                            types: { EIP712Domain: [] },
                            primaryType: 'EIP712Domain',
                            domain: { chainId: 1 },
                            message: {},
                        },
                    },
                    source: desktopSource,
                }),
        },
        {
            method: 'solanaSignTransaction',
            symbol: 'sol',
            createCall: () =>
                connectPopupCallThunk({
                    method: 'solanaSignTransaction',
                    payload: { path: "m/44'/501'/0'/0'", serializedTx: 'aa' },
                    source: desktopSource,
                }),
        },
        {
            method: 'stellarSignTransaction',
            symbol: 'xlm',
            createCall: () =>
                connectPopupCallThunk({
                    method: 'stellarSignTransaction',
                    payload: { path: "m/44'/148'/0'", xdrBase64: 'AAAA', testnet: false },
                    source: desktopSource,
                }),
        },
    ])(
        'reviews $method with a placeholder $symbol account removed once the call ends',
        async ({ symbol, precomposed, createCall }) => {
            mockConnectCall({ response: { success: true, payload: {} }, precomposed });
            const store = initCallStore();

            await store.dispatch(createCall());

            const actions = store.getActions();
            const createdAccount = actions
                .filter(accountsActions.createAccount.match)
                .map(({ payload }) => payload.account);
            expect(createdAccount).toEqual([
                expect.objectContaining({ symbol, accountType: 'placeholder' }),
            ]);
            expect(actions.filter(connectPopupActions.setSelectedAccountKey.match)).toEqual([
                connectPopupActions.setSelectedAccountKey({
                    selectedAccountKey: createdAccount[0]!.key,
                }),
            ]);
            expect(actions.filter(accountsActions.removeAccount.match)).toEqual([
                accountsActions.removeAccount(createdAccount),
            ]);

            // Removed once the call ends, before the discovery middleware reacts to its end.
            const actionTypes = getActionTypes(store);
            const removeAccountIndex = actionTypes.indexOf(accountsActions.removeAccount.type);
            expect(removeAccountIndex).toBeGreaterThan(
                actionTypes.indexOf(connectPopupActions.finishCall.type),
            );
            expect(removeAccountIndex).toBeLessThan(
                actionTypes.indexOf(connectPopupCallInnerThunk.fulfilled.type),
            );
        },
    );

    it('removes the placeholder account when the signing call throws', async () => {
        mockConnectCall({ response: undefined, precomposed: bitcoinPrecomposedTx });
        mockedConnectCall.mockImplementationOnce(mockedConnectCall.getMockImplementation()!);
        mockedConnectCall.mockImplementation(() => Promise.reject(new Error('Transport broke')));
        const store = initCallStore();

        const response = getPopupCallDeferred(true).promise;
        await store.dispatch(
            connectPopupCallThunk({
                method: 'signTransaction',
                payload: { coin: 'btc', inputs: [], outputs: [] },
                source: desktopSource,
            }),
        );

        await expect(response).resolves.toMatchObject({ success: false });
        const createdAccount = store
            .getActions()
            .filter(accountsActions.createAccount.match)
            .map(({ payload }) => payload.account);
        expect(store.getActions().filter(accountsActions.removeAccount.match)).toEqual([
            accountsActions.removeAccount(createdAccount),
        ]);
    });
});

describe('connectPopupCallThunk — method registry', () => {
    beforeEach(() => {
        mockedConnectCall.mockReset();
        mockConnectCall({ response: { success: true, payload: { model: 'T3T1' } } });
    });

    afterEach(() => {
        mockedGetMethodDefinition.mockImplementation(actualGetMethodDefinition);
    });

    it('runs only the steps of the called method', async () => {
        const calledMethod = {
            validate: mock<MethodStep<'getFeatures', 'validate'>>(),
            preCall: mock<MethodStep<'getFeatures', 'preCall'>>(),
            postCall: mock<MethodStep<'getFeatures', 'postCall'>>(() => false),
        };
        const otherMethod = {
            compatibility: mock<MethodStep<'getDeviceState', 'compatibility'>>(),
            validate: mock<MethodStep<'getDeviceState', 'validate'>>(),
            preCall: mock<MethodStep<'getDeviceState', 'preCall'>>(),
            postCall: mock<MethodStep<'getDeviceState', 'postCall'>>(() => false),
        };
        mockMethodDefinitions({ getFeatures: calledMethod, getDeviceState: otherMethod });
        const store = initCallStore();

        await store.dispatch(
            connectPopupCallThunk({ method: 'getFeatures', payload: {}, source: desktopSource }),
        );

        expect(calledMethod.validate).toHaveBeenCalledWith({
            method: 'getFeatures',
            payload: {},
            source: desktopSource,
        });
        expect(calledMethod.preCall).toHaveBeenCalledTimes(1);
        expect(calledMethod.postCall).toHaveBeenCalledTimes(1);
        expect(otherMethod.compatibility).not.toHaveBeenCalled();
        expect(otherMethod.validate).not.toHaveBeenCalled();
        expect(otherMethod.preCall).not.toHaveBeenCalled();
        expect(otherMethod.postCall).not.toHaveBeenCalled();
    });

    it('continues with the definition of the method a compatibility step redirects to', async () => {
        const redirectingMethod = {
            compatibility: mock<MethodStep<'getFeatures', 'compatibility'>>(() => ({
                method: 'getDeviceState',
                payload: { keepSession: true },
            })),
            preCall: mock<MethodStep<'getFeatures', 'preCall'>>(),
        };
        const targetMethod = {
            compatibility: mock<MethodStep<'getDeviceState', 'compatibility'>>(),
            preCall: mock<MethodStep<'getDeviceState', 'preCall'>>(),
        };
        mockMethodDefinitions({ getFeatures: redirectingMethod, getDeviceState: targetMethod });
        const store = initCallStore();

        await store.dispatch(
            connectPopupCallThunk({ method: 'getFeatures', payload: {}, source: desktopSource }),
        );

        expect(targetMethod.compatibility).not.toHaveBeenCalled();
        expect(redirectingMethod.preCall).not.toHaveBeenCalled();
        expect(targetMethod.preCall).toHaveBeenCalledWith(
            expect.objectContaining({ method: 'getDeviceState', payload: { keepSession: true } }),
        );
        expect(getDeviceCallParams()).toEqual([
            expect.objectContaining({ method: 'getDeviceState', keepSession: true }),
        ]);
    });

    it('calls the device with the payload from preCall and passes both payloads to postCall', async () => {
        const method = {
            preCall: mock<MethodStep<'getFeatures', 'preCall'>>(() => ({ keepSession: true })),
            postCall: mock<MethodStep<'getFeatures', 'postCall'>>(() => false),
        };
        mockMethodDefinitions({ getFeatures: method });
        const store = initCallStore();

        await store.dispatch(
            connectPopupCallThunk({ method: 'getFeatures', payload: {}, source: desktopSource }),
        );

        expect(getDeviceCallParams()).toEqual([
            expect.objectContaining({ method: 'getFeatures', keepSession: true }),
        ]);
        expect(method.postCall).toHaveBeenCalledWith(
            expect.objectContaining({
                payload: { keepSession: true },
                originalPayload: {},
                response: expect.objectContaining({ success: true, payload: { model: 'T3T1' } }),
            }),
        );
    });

    it('keeps the call open when postCall resolves to true', async () => {
        mockMethodDefinitions({
            getFeatures: { postCall: mock<MethodStep<'getFeatures', 'postCall'>>(() => true) },
        });
        const store = initCallStore();

        const response = getPopupCallDeferred(true).promise;
        await store.dispatch(
            connectPopupCallThunk({ method: 'getFeatures', payload: {}, source: desktopSource }),
        );

        await expect(response).resolves.toMatchObject({ success: true });
        expect(getActionTypes(store)).not.toContain(connectPopupActions.finishCall.type);
    });
});

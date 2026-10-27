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
import * as walletUtils from '@suite-common/wallet-utils';
import TrezorConnect, { type CardanoPublicKey, type PrecomposeParams } from '@trezor/connect';
import { TypedError, serializeError } from '@trezor/connect-common/src/constants/errors';
import { mock, mockNotExpected } from '@trezor/dependency-injection';
import { type WithServices } from '@trezor/redux-utils';
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
    type ConnectPopupLoadSelectAccountPageThunkState,
    connectPopupCallThunk,
    connectPopupFinishCallThunk,
    connectPopupLoadSelectAccountPageThunk,
    connectPopupResolveSelectAccountThunk,
} from './connectPopupThunks';
import { type ConnectCallSource, UNKNOWN_PROCESS } from './connectPopupTypes';

jest.mock('@trezor/connect', () => ({
    ...jest.requireActual('@trezor/connect'),
    __esModule: true,
    default: {
        call: jest.fn(),
        pushTransaction: jest.fn(),
        updateConnectSettings: jest.fn(),
    },
}));

// prepareNewAccountPayload is the device round-trip the load thunk awaits — exactly once on the
// manual address-phase path these tests exercise (the account-index path loops it per row). Mocking
// it with a controllable deferred lets us interleave two concurrent loads deterministically.
jest.mock('@suite-common/wallet-utils', () => ({
    ...jest.requireActual('@suite-common/wallet-utils'),
    prepareNewAccountPayload: jest.fn(),
}));

const mockedPrepare = walletUtils.prepareNewAccountPayload as jest.Mock;

const createDeferred = <T>() => {
    let resolve!: (value: T) => void;
    const promise = new Promise<T>(r => {
        resolve = r;
    });

    return { promise, resolve };
};

const fakeDevice = mockSuiteDevice({
    connected: true,
    path: '1',
    instance: 0,
    state: undefined,
    useEmptyPassphrase: true,
});
const fakeDeviceState: DeviceReducerState = { ...deviceInitialState, selectedDevice: fakeDevice };

// A UTXO `addressSelection: 'manual'` picker sitting in the address phase, with an empty candidate
// list (the cold-cache drill-in). A *custom* account-type tab (no `accountType`) keeps the thunk on
// a path that does not read Redux discovery, so the store only needs an empty wallet/accounts slice.
const selectAccountState = {
    method: 'selectAccount',
    state: 'select-account',
    payload: {},
    options: {
        symbol: 'btc',
        mode: 'address',
        addressSelection: 'manual',
        accountTypeTabs: [{ key: 'custom', bip43Path: "m/84'/0'/i'", customLabel: 'Custom' }],
    },
    selectedAccountTypeKey: 'custom',
    page: 0,
    candidates: [],
    manualPhase: 'address',
    manualAccountIndex: 0,
    exported: false,
};

const usedAddress = (address: string) => ({
    accountInfo: { addresses: { used: [{ path: "m/84'/0'/0'/0/0", address, balance: '1000' }] } },
});

const connectPopupReducer = prepareConnectPopupReducer({
    actionTypes: { storageLoad: mockActionType('storageLoad') },
});

const initStore = () =>
    createTestCompositionRoot<
        WithServices<LockDeviceDep>,
        ConnectPopupLoadSelectAccountPageThunkState
    >({
        services: () => ({ lockDevice: mock<LockDevice>() }),
        reducer: combineReducers({
            connectPopup: connectPopupReducer,
            device: (state = fakeDeviceState) => state,
            wallet: (state = { accounts: accountsInitialState }) => state,
        }),
        preloadedState: {
            connectPopup: { activeCall: selectAccountState, permissions: [] },
            device: fakeDeviceState,
            wallet: { accounts: accountsInitialState },
        },
    }).services.store;

describe('connectPopupLoadSelectAccountPageThunk — concurrent loads', () => {
    beforeEach(() => {
        mockedPrepare.mockReset();
    });

    it('dedups a concurrent load of the same view, so the device round-trip runs only once', async () => {
        const first = createDeferred();
        mockedPrepare.mockReturnValueOnce(first.promise);

        const store = initStore();

        // Two loads of the same view start before the first resolves (mirrors the auto-load effect
        // firing a second load while a nav thunk's load still awaits with candidates === []).
        const loadFirst = store.dispatch(connectPopupLoadSelectAccountPageThunk({ page: 0 }));
        const loadSecond = store.dispatch(connectPopupLoadSelectAccountPageThunk({ page: 0 }));

        // The second load is deduped at entry (loadingKey is stamped synchronously, before any
        // await), so it never issues its own (expensive) device round-trip — the count is already 1
        // here, not merely once the load settles.
        expect(mockedPrepare).toHaveBeenCalledTimes(1);
        await loadSecond;
        expect(mockedPrepare).toHaveBeenCalledTimes(1);

        // The single running load paints the page, leaving no row stuck in a loading state.
        first.resolve(usedAddress('ADDR_ONLY'));
        await loadFirst;

        const candidates =
            selectConnectPopupCallWithState(store.getState(), 'select-account')?.candidates ?? [];
        expect(candidates.map(c => c.address)).toEqual(['ADDR_ONLY']);
        expect(candidates.every(c => !c.loading)).toBe(true);
    });

    it('does not dedup a load of a different view — a page change still issues its own round-trip', async () => {
        const page0 = createDeferred();
        const page1 = createDeferred();
        mockedPrepare.mockReturnValueOnce(page0.promise).mockReturnValueOnce(page1.promise);

        const store = initStore();

        // A load for page 0 is in flight; paging to a different view must NOT be swallowed by the
        // dedup guard (that would strand the user on the wrong page — the epoch resolves the race).
        const loadPage0 = store.dispatch(connectPopupLoadSelectAccountPageThunk({ page: 0 }));
        const loadPage1 = store.dispatch(connectPopupLoadSelectAccountPageThunk({ page: 1 }));

        expect(mockedPrepare).toHaveBeenCalledTimes(2);

        // Resolve the newer page-1 load first and let the superseded page-0 load land LAST. The
        // ordering matters: this is what actually exercises loadEpoch. With the opposite order page 1
        // would win on timing alone and the assertion below would pass even with the epoch guard
        // removed — the stale page-0 result has to arrive last for the guard to be the thing that
        // keeps it from painting.
        page1.resolve(usedAddress('ADDR_PAGE1'));
        page0.resolve(usedAddress('ADDR_PAGE0'));
        await Promise.all([loadPage0, loadPage1]);

        // Latest-wins: the stale page-0 load lands last but must not paint the user back onto page 0
        // — loadEpoch makes it bail.
        expect(selectConnectPopupCallWithState(store.getState(), 'select-account')?.page).toBe(1);
    });

    it('a superseded load does not release a newer same-view load’s dedup slot (X→Y→X re-navigation)', async () => {
        const a = createDeferred();
        const b = createDeferred();
        const c = createDeferred();
        mockedPrepare
            .mockReturnValueOnce(a.promise)
            .mockReturnValueOnce(b.promise)
            .mockReturnValueOnce(c.promise);

        const store = initStore();

        // Drill account 0 (Load A takes key K0), navigate to account 1 (a different key), then back
        // to account 0 (Load C re-takes K0 — newer than A). All three run: across the two hops the
        // key changes, so neither hop is deduped.
        const loadA = store.dispatch(connectPopupLoadSelectAccountPageThunk({ page: 0 }));
        store.dispatch(connectPopupActions.updateSelectAccount({ manualAccountIndex: 1 }));
        const loadB = store.dispatch(connectPopupLoadSelectAccountPageThunk({ page: 0 }));
        store.dispatch(connectPopupActions.updateSelectAccount({ manualAccountIndex: 0 }));
        const loadC = store.dispatch(connectPopupLoadSelectAccountPageThunk({ page: 0 }));
        expect(mockedPrepare).toHaveBeenCalledTimes(3);

        // The stale first load (A) settles first — it must NOT clear C's identical-key slot, or the
        // dedup window re-opens and a redundant (slow) device round-trip can slip back in.
        a.resolve(usedAddress('ADDR_A'));
        await loadA;
        expect(
            selectConnectPopupCallWithState(store.getState(), 'select-account')?.loadingKey,
        ).toBe('address:custom:0:0');

        b.resolve(usedAddress('ADDR_B'));
        c.resolve(usedAddress('ADDR_C'));
        await Promise.all([loadB, loadC]);
    });

    it('a re-issued selectAccount setup clears a stale loadingKey so the new picker can load', async () => {
        const inflight = createDeferred();
        const reopened = createDeferred();
        mockedPrepare.mockReturnValueOnce(inflight.promise).mockReturnValueOnce(reopened.promise);

        const store = initStore();

        // A load is in flight, so loadingKey is stamped and still held.
        const loadInflight = store.dispatch(connectPopupLoadSelectAccountPageThunk({ page: 0 }));
        expect(
            selectConnectPopupCallWithState(store.getState(), 'select-account')?.loadingKey,
        ).toBeDefined();

        // A new selectAccount call must not keep the old loadingKey. See #29662.
        store.dispatch(
            connectPopupActions.selectAccount({
                options: selectAccountState.options,
                selectedAccountTypeKey: 'custom',
                candidates: [],
                page: 0,
                manualPhase: 'address',
                exported: false,
            } as unknown as Parameters<typeof connectPopupActions.selectAccount>[0]),
        );
        expect(
            selectConnectPopupCallWithState(store.getState(), 'select-account')?.loadingKey,
        ).toBeUndefined();

        // The re-initialized picker can load again — its round-trip is not swallowed by the dedup
        // guard (the count goes 1 → 2, so a genuinely new load ran).
        const loadReopened = store.dispatch(connectPopupLoadSelectAccountPageThunk({ page: 0 }));
        expect(mockedPrepare).toHaveBeenCalledTimes(2);

        inflight.resolve(usedAddress('ADDR_INFLIGHT'));
        reopened.resolve(usedAddress('ADDR_REOPENED'));
        await Promise.all([loadInflight, loadReopened]);
    });

    it('loads the page when a single load runs to completion (no deadlock)', async () => {
        const only = createDeferred();
        mockedPrepare.mockReturnValueOnce(only.promise);

        const store = initStore();

        const load = store.dispatch(connectPopupLoadSelectAccountPageThunk({ page: 0 }));
        only.resolve(usedAddress('ADDR_ONLY'));
        await load;

        const candidates =
            selectConnectPopupCallWithState(store.getState(), 'select-account')?.candidates ?? [];
        expect(candidates.map(c => c.address)).toEqual(['ADDR_ONLY']);
    });
});

describe('connectPopupFinishCallThunk', () => {
    it('answers a call that ended with a device error when its popup is closed', async () => {
        const store = initStore();
        const deferred = getPopupCallDeferred(true);
        const error = serializeError(TypedError('Device_Disconnected'));
        store.dispatch(connectPopupActions.setError(error));

        store.dispatch(connectPopupFinishCallThunk());

        await expect(deferred.promise).resolves.toEqual({ success: false, error });
        expect(selectConnectPopupCall(store.getState())?.state).toBe('finished');
    });
});

type CallThunkTestState = ConnectPopupCallThunkState & AccountsRootState & NetworksRootState;

type AnalyticsService = AnalyticsDep['analytics'];

type CallThunkTestStore = TestCompositionStore<CallThunkTestState, ConnectPopupCallThunkDeps>;

// Reacts to the popup UI the way a user would.
type SimulatedUser = (action: UnknownAction, store: CallThunkTestStore) => void;

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

            const actionTypes = getActionTypes(store);
            expect(actionTypes.indexOf(accountsActions.removeAccount.type)).toBeLessThan(
                actionTypes.indexOf(connectPopupActions.finishCall.type),
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

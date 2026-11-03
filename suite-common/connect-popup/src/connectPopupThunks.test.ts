import { combineReducers } from '@reduxjs/toolkit';

import { events } from '@suite-common/analytics';
import { type DeviceReducerState, deviceInitialState } from '@suite-common/device';
import { type LockDevice, type LockDeviceDep } from '@suite-common/suite-types';
import { mockSuiteDevice } from '@suite-common/suite-types/mocks';
import { createTestCompositionRoot } from '@suite-common/test-utils';
import { accountsInitialState } from '@suite-common/wallet-core';
import * as walletUtils from '@suite-common/wallet-utils';
import { type CallMethodKeys } from '@trezor/connect';
import { TypedError, serializeError } from '@trezor/connect-common/src/constants/errors';
import { mock, mockNotExpected } from '@trezor/dependency-injection';
import { type WithServices } from '@trezor/redux-utils';
import { mockActionType } from '@trezor/redux-utils/mocks';

import { connectPopupActions } from './connectPopupActions';
import { getPopupCallDeferred } from './connectPopupPromiseManager';
import {
    prepareConnectPopupReducer,
    selectConnectPopupCall,
    selectConnectPopupCallWithState,
} from './connectPopupReducer';
import {
    type ConnectPopupCallInnerThunkDeps,
    type ConnectPopupLoadSelectAccountPageThunkState,
    connectPopupCallInnerThunk,
    connectPopupFinishCallThunk,
    connectPopupLoadSelectAccountPageThunk,
} from './connectPopupThunks';
import {
    CommonPopupFlow,
    type PopupFlowParams,
    type PopupFlowPayload,
} from './popupFlows/CommonPopupFlow';

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

describe('connectPopupCallInnerThunk', () => {
    // The deprecated interactive composeTransaction, which the popup flow runs as sendTransaction.
    const interactiveComposeParams: PopupFlowParams<CallMethodKeys> = {
        method: 'composeTransaction',
        payload: {
            coin: 'btc',
            outputs: [{ type: 'payment', address: 'bc1qrecipient', amount: '1000' }],
        },
        source: { type: 'web', origin: 'https://app.example', manifest: { appName: 'app' } },
    };

    const runCallThunk = async (params: PopupFlowParams<CallMethodKeys>) => {
        const dispatch = jest.fn();
        const extra: ConnectPopupCallInnerThunkDeps = {
            services: {
                analytics: {
                    init: mockNotExpected('init'),
                    enable: mockNotExpected('enable'),
                    disable: mockNotExpected('disable'),
                    isEnabled: mockNotExpected('isEnabled'),
                    setUrl: mockNotExpected('setUrl'),
                    setLoggerEnabled: mockNotExpected('setLoggerEnabled'),
                    report: mock(),
                },
                lockDevice: mock(),
            },
        };
        const deferred = getPopupCallDeferred(true);

        await connectPopupCallInnerThunk(params)(dispatch, jest.fn(), extra);

        return { dispatch, deferred, ...extra.services, report: extra.services.analytics.report };
    };

    beforeEach(() => {
        jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('answers and reports a successful call as requested, not as rewritten for compatibility', async () => {
        const response = { success: true, payload: { message: 'ok' } } as const;
        const run = jest.spyOn(CommonPopupFlow.prototype, 'run').mockResolvedValue(response);

        const { deferred, report } = await runCallThunk(interactiveComposeParams);

        expect(run.mock.contexts[0]).toMatchObject({ method: 'sendTransaction' });
        await expect(deferred.promise).resolves.toBe(response);
        expect(report).toHaveBeenCalledWith({
            type: events.connectPopupCallEvent.name,
            payload: expect.objectContaining({
                method: 'composeTransaction',
                paramNames: ['coin', 'outputs'],
            }),
        });
    });

    it('answers and reports a failed call, cleaning the flow up only after the error is shown', async () => {
        jest.spyOn(CommonPopupFlow.prototype, 'run').mockRejectedValue(
            TypedError('Method_InvalidParameter'),
        );
        const cleanup = jest.spyOn(CommonPopupFlow.prototype, 'cleanup');

        const { dispatch, deferred, report, lockDevice } =
            await runCallThunk(interactiveComposeParams);

        await expect(deferred.promise).resolves.toEqual({
            success: false,
            error: expect.objectContaining({ code: 'Method_InvalidParameter' }),
        });
        expect(report).toHaveBeenCalledWith({
            type: events.connectPopupErrorEvent.name,
            payload: expect.objectContaining({
                method: 'composeTransaction',
                error: 'Method_InvalidParameter',
            }),
        });
        const setErrorIndex = dispatch.mock.calls.findIndex(([action]) =>
            connectPopupActions.setError.match(action),
        );
        expect(cleanup).toHaveBeenCalledTimes(1);
        expect(dispatch.mock.invocationCallOrder[setErrorIndex]).toBeLessThan(
            cleanup.mock.invocationCallOrder[0]!,
        );
        expect(lockDevice).toHaveBeenCalledWith(false);
    });

    it('neither answers nor reports a call waiting for the device to be reconnected', async () => {
        jest.spyOn(CommonPopupFlow.prototype, 'run').mockRejectedValue(
            TypedError('Device_Disconnected'),
        );

        const { dispatch, report } = await runCallThunk(interactiveComposeParams);

        expect(dispatch).toHaveBeenCalledWith(
            connectPopupActions.setError(serializeError(TypedError('Device_Disconnected'))),
        );
        expect(report).not.toHaveBeenCalled();
    });

    it('passes a malformed deeplink payload to Connect unchanged', async () => {
        const run = jest
            .spyOn(CommonPopupFlow.prototype, 'run')
            .mockRejectedValue(TypedError('Method_InvalidParameter'));

        const { deferred } = await runCallThunk({
            ...interactiveComposeParams,
            // Deeplink payloads are arbitrary JSON, not representable by the payload types.
            payload: null as unknown as PopupFlowPayload<CallMethodKeys>,
        });

        expect(run.mock.contexts[0]).toMatchObject({ method: 'composeTransaction', payload: null });
        await expect(deferred.promise).resolves.toEqual({
            success: false,
            error: expect.objectContaining({ code: 'Method_InvalidParameter' }),
        });
    });

    it.each<unknown>([
        'constructor',
        'toString',
        '__proto__',
        // Cannot even be converted to a property key, yet postMessage and JSON both carry it.
        { toString: 'x' },
    ])('answers a call of the unknown method %s as unsupported', async method => {
        const { dispatch, deferred, lockDevice } = await runCallThunk({
            ...interactiveComposeParams,
            // Host apps can send any method name.
            method: method as CallMethodKeys,
        });

        expect(dispatch).toHaveBeenCalledWith(connectPopupActions.finishCall());
        await expect(deferred.promise).resolves.toEqual({
            success: false,
            error: expect.objectContaining({ code: 'Method_Unsupported' }),
        });
        expect(lockDevice).toHaveBeenCalledWith(false);
    });
});

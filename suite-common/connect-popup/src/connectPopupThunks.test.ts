import { combineReducers } from '@reduxjs/toolkit';

import { configureMockStore, extraDependenciesCommonMock } from '@suite-common/test-utils';
import * as walletUtils from '@suite-common/wallet-utils';

import { connectPopupActions } from './connectPopupActions';
import { prepareConnectPopupReducer, selectConnectPopupCallWithState } from './connectPopupReducer';
import { connectPopupLoadSelectAccountPageThunk } from './connectPopupThunks';

// prepareNewAccountPayload is the single awaited device round-trip in the load thunk; mocking it
// with a controllable deferred lets us interleave two concurrent loads deterministically.
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

const fakeDevice = {
    connected: true,
    path: '1',
    instance: 0,
    state: undefined,
    useEmptyPassphrase: true,
};

// A UTXO `addressSelection: 'manual'` picker sitting in the address phase, with an empty candidate
// list (the cold-cache drill-in). A *custom* account-type tab (no `accountType`) keeps the thunk on
// a path that does not read Redux discovery, so the store needs no wallet/accounts slice.
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

const connectPopupReducer = prepareConnectPopupReducer(extraDependenciesCommonMock);

const initStore = () =>
    configureMockStore({
        extra: extraDependenciesCommonMock,
        reducer: combineReducers({
            connectPopup: connectPopupReducer,
            device: (state = { selectedDevice: fakeDevice }) => state,
        }),
        preloadedState: {
            connectPopup: { activeCall: selectAccountState, permissions: [] },
            device: { selectedDevice: fakeDevice },
        },
    });

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

        // The second load is deduped at entry — it never issues its own (expensive) device round-trip.
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

        page0.resolve(usedAddress('ADDR_PAGE0'));
        page1.resolve(usedAddress('ADDR_PAGE1'));
        await Promise.all([loadPage0, loadPage1]);
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

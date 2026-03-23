import '@suite-common/test-utils/src/globalOverrides';

import { initialRunCompleted, prepareFlagsReducer } from '@suite/flags';
import { deviceActions, selectDevices, selectDevicesCount } from '@suite-common/device';
import { asEncryptedHex } from '@suite-common/platform-encryption';
import { setSuiteSyncOwner } from '@suite-common/suite-sync';
import { type SuiteSyncOwnerSerialized } from '@suite-common/suite-sync-storage';
import { mockSuiteDevice } from '@suite-common/suite-types/mocks';
import { testMocks } from '@suite-common/test-utils';
import {
    changeCoinVisibility,
    prepareDiscoveryReducer,
    prepareSendFormReducer,
    transactionsActions,
} from '@suite-common/wallet-core';
import * as discoveryActions from '@suite-common/wallet-core';
import { type AccountKey, asAccountDescriptor } from '@suite-common/wallet-types';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { getAccountIdentifier, getAccountTransactions } from '@suite-common/wallet-utils';

import { deviceSlice } from 'src/actions/device/deviceSlice';
import { suiteSyncSlice } from 'src/actions/suiteSync/suiteSyncSlice';
import { suiteSyncQuotaManagerSlice } from 'src/actions/suiteSyncQuotaManager/suiteSyncQuotaManagerSlice';
import { SETTINGS } from 'src/config/suite';
import storageMiddleware from 'src/middlewares/wallet/storageMiddleware';
import suiteReducer from 'src/reducers/suite/suiteReducer';
import { accountsReducer, fiatRatesReducer, transactionsReducer } from 'src/reducers/wallet';
import { coinjoinReducer } from 'src/reducers/wallet/coinjoinReducer';
import graphReducer from 'src/reducers/wallet/graphReducer';
import { db } from 'src/storage';
import { extraDependencies } from 'src/support/extraDependencies';
import { preloadStore } from 'src/support/suite/preloadStore';
import { configureStore } from 'src/support/tests/configureStore';
import { type AcquiredDevice, type AppState } from 'src/types/suite';

import * as storageActions from '../storageActions';

const { getWalletTransaction } = testMocks;

const discoveryReducer = prepareDiscoveryReducer(extraDependencies);
const deviceReducer = deviceSlice.prepareReducer(extraDependencies);
const flagsReducer = prepareFlagsReducer(extraDependencies);
const sendFormReducer = prepareSendFormReducer(extraDependencies);
const walletSettingsReducer = discoveryActions.prepareWalletSettingsReducer(extraDependencies);
const quotaManagerSliceReducer = suiteSyncQuotaManagerSlice.prepareReducer(extraDependencies);
const suiteSyncReducer = suiteSyncSlice.prepareReducer(extraDependencies);

// TODO: add method in suite-storage for deleting all stored data (done as a static method on SuiteDB), call it after each test
// TODO: test deleting device instances on parent device forget

const dev1 = mockSuiteDevice({
    state: { staticSessionId: '1stTestnetAddress@device_a_id:0' },
    path: '1',
    instance: 1,
    remember: true, // normally it would be set by SUITE.REMEMBER_DEVICE dispatched from modalActions.onRememberDevice()
});
const dev2 = mockSuiteDevice({
    state: { staticSessionId: '1stTestnetAddress@device_b_id:0' },
    path: '2',
    instance: 1,
    remember: true, // normally it would be set by SUITE.REMEMBER_DEVICE dispatched from modalActions.onRememberDevice()
});
const dev2Instance1 = mockSuiteDevice({
    state: { staticSessionId: '1stTestnetAddress@device_c_id:0' },
    path: '2',
    instance: 2,
    remember: true, // normally it would be set by SUITE.REMEMBER_DEVICE dispatched from modalActions.onRememberDevice()
});

const acc1 = mockWalletAccount({
    deviceState: dev1.state?.staticSessionId,
    symbol: 'btc',
    descriptor: asAccountDescriptor('desc1'),
});
const acc2 = mockWalletAccount({
    deviceState: dev2.state?.staticSessionId,
    symbol: 'btc',
    descriptor: asAccountDescriptor('desc2'),
});

const tx1 = getWalletTransaction({
    deviceState: dev1.state?.staticSessionId,
    txid: 'txid1',
    descriptor: asAccountDescriptor('desc1'),
    symbol: 'btc',
});
const tx2 = getWalletTransaction({
    deviceState: dev2.state?.staticSessionId,
    txid: 'txid2',
    descriptor: asAccountDescriptor('desc2'),
    symbol: 'btc',
});

type PartialState = Pick<
    AppState,
    'suite' | 'device' | 'suiteSync' | 'suiteSyncQuotaManager' | 'flags'
> & {
    wallet: Partial<
        Pick<
            AppState['wallet'],
            | 'accounts'
            | 'coinjoin'
            | 'settings'
            | 'discovery'
            | 'send'
            | 'transactions'
            | 'graph'
            | 'fiat'
        >
    >;
};

const getInitialState = (prevState?: Partial<PartialState>, action?: any) => ({
    suite: suiteReducer(
        prevState ? prevState.suite : undefined,
        action || ({ type: 'foo' } as any),
    ),
    flags: flagsReducer(
        prevState ? prevState.flags : undefined,
        action || ({ type: 'foo' } as any),
    ),
    suiteSync: suiteSyncReducer(
        prevState ? prevState.suiteSync : undefined,
        action || ({ type: 'foo' } as any),
    ),
    suiteSyncQuotaManager: quotaManagerSliceReducer(
        prevState ? prevState.suiteSyncQuotaManager : undefined,
        action || ({ type: 'foo' } as any),
    ),
    device: deviceReducer(
        prevState ? prevState.device : undefined,
        action || ({ type: 'foo' } as any),
    ),
    wallet: {
        accounts: accountsReducer(
            prevState && prevState.wallet ? prevState.wallet.accounts : undefined,
            action || ({ type: 'foo' } as any),
        ),
        coinjoin: coinjoinReducer(
            prevState && prevState.wallet ? prevState.wallet.coinjoin : undefined,
            action || ({ type: 'foo' } as any),
        ),
        settings: walletSettingsReducer(
            prevState && prevState.wallet ? prevState.wallet.settings : undefined,
            action || ({ type: 'foo' } as any),
        ),
        discovery: discoveryReducer(
            prevState && prevState.wallet ? prevState.wallet.discovery : undefined,
            action || ({ type: 'foo' } as any),
        ),
        send: sendFormReducer(
            prevState && prevState.wallet ? prevState.wallet.send : undefined,
            action || ({ type: 'foo' } as any),
        ),
        transactions: transactionsReducer(
            prevState && prevState.wallet ? prevState.wallet.transactions : undefined,
            action || ({ type: 'foo' } as any),
        ),
        fiat: fiatRatesReducer(
            prevState && prevState.wallet ? prevState.wallet.fiat : undefined,
            action || ({ type: 'foo' } as any),
        ),
        graph: graphReducer(
            prevState && prevState.wallet ? prevState.wallet.graph : undefined,
            action || ({ type: 'foo' } as any),
        ),
        formDrafts: {},
    },
});

type State = ReturnType<typeof getInitialState>;
const middlewares = [storageMiddleware];

const mockStore = configureStore<State, any>(middlewares);

type mockStoreType = ReturnType<typeof mockStore>;

const updateStore = (store: mockStoreType) => {
    store.subscribe(() => {
        const action = store.getActions().pop();
        const prevState = store.getState();
        store.getState().suite = getInitialState(prevState, action).suite;
        store.getState().flags = getInitialState(prevState, action).flags;
        store.getState().suiteSync = getInitialState(prevState, action).suiteSync;
        store.getState().device = getInitialState(prevState, action).device;
        store.getState().wallet = getInitialState(prevState, action).wallet;
        store.getActions().push(action);
    });
};

const mockFetch = (data: any) =>
    jest.fn().mockImplementation(() =>
        Promise.resolve({
            ok: true,
            json: () => data,
        }),
    );

describe('Storage actions', () => {
    // afterEach(async () => {
    //     await indexedDB.deleteDatabase('trezor-suite');
    // });

    it('should store wallet settings in the db and update them automatically', async () => {
        const store = mockStore(getInitialState());
        updateStore(store);

        // save wallet settings to the db
        await store.dispatch(storageActions.saveWalletSettings());
        // change local currency in the reducer, changes should be synced to the db via storageMiddleware
        await store.dispatch(discoveryActions.setBaseCurrency('czk'));
        const { settings } = store.getState().wallet;
        store.dispatch(await preloadStore());

        // check if stored local currency is 'czk'
        expect(store.getState().wallet.settings.localCurrency).toEqual('czk');
        // compare stored settings object with one in the reducer
        expect(store.getState().wallet.settings).toEqual(settings);
    });

    it('should store suite settings in the db and update them automatically', async () => {
        const store = mockStore(getInitialState());
        updateStore(store);
        const f = global.fetch;
        global.fetch = mockFetch({ TR_ID: 'Message' });
        await store.dispatch(storageActions.saveSuiteSettings());
        await store.dispatch(initialRunCompleted());
        store.dispatch(await preloadStore());

        expect(store.getState().flags.initialRun).toEqual(false);
        global.fetch = f;
    });

    it('should store, override and remove send form', async () => {
        let store = mockStore(getInitialState());
        updateStore(store);

        // @ts-expect-error partial params
        await storageActions.saveDraft({ address: 'a' }, 'account-key');
        store.dispatch(await preloadStore());
        expect(store.getState().wallet.send.drafts).toEqual({ 'account-key': { address: 'a' } });

        // @ts-expect-error partial params
        await storageActions.saveDraft({ address: 'b' }, 'account-key');
        store.dispatch(await preloadStore());
        expect(store.getState().wallet.send.drafts).toEqual({ 'account-key': { address: 'b' } });

        await storageActions.removeDraft('account-key' as AccountKey); // Todo: create properly via `createAccountKey()`
        store = mockStore(getInitialState());
        updateStore(store);
        store.dispatch(await preloadStore());
        expect(store.getState().wallet.send.drafts).toEqual({});
    });

    it('should store remembered device', async () => {
        let store = mockStore(
            getInitialState({
                device: {
                    devices: [dev1, dev2, dev2Instance1],
                    persistentDeviceData: [],
                    isConnectionModalOpen: false,
                    defaultConnectionMode: 'cable',
                },
                wallet: {
                    accounts: [acc1, acc2],
                    send: {
                        drafts: {
                            // @ts-expect-error partial params
                            'desc1-btc-state1': { address: 'A' },
                        },
                    },
                },
            }),
        );
        updateStore(store);

        // add txs
        store.dispatch(transactionsActions.addTransaction({ transactions: [tx1], account: acc1 }));
        store.dispatch(transactionsActions.addTransaction({ transactions: [tx2], account: acc2 }));

        // remember devices
        await store.dispatch(storageActions.rememberDevice(dev1));
        await store.dispatch(storageActions.rememberDevice(dev2));
        await store.dispatch(storageActions.rememberDevice(dev2Instance1));

        store.dispatch(await preloadStore());

        // stored devices
        const load1 = store.getState();
        const load1DevicesCount = selectDevicesCount(load1);
        expect(load1DevicesCount).toEqual(3);
        expect(load1.device.devices[0]).toEqual({ ...dev1, path: '' });

        // stored txs
        const acc1Txs = getAccountTransactions(acc1.key, load1.wallet.transactions.transactions);

        // stored drafts
        expect(load1.wallet.send.drafts).toEqual({
            'desc1-btc-state1': { address: 'A' },
        });

        expect(acc1Txs.length).toEqual(1);
        expect(acc1Txs[0].deviceState).toEqual(tx1.deviceState);
        // stored accounts
        expect(load1.wallet.accounts.length).toEqual(2);
        expect(load1.wallet.accounts[0]).toEqual(acc1);

        // stored device2
        expect(load1.device.devices[1].state).toEqual(dev2.state);
        // stored txs
        const acc2Txs = getAccountTransactions(acc2.key, load1.wallet.transactions.transactions);

        expect(acc2Txs.length).toEqual(1);
        expect(acc2Txs[0].deviceState).toEqual(tx2.deviceState);
        // stored 1 account
        expect(load1.wallet.accounts[1]).toEqual(acc2);

        // forget dev1
        await store.dispatch(storageActions.forgetDevice(dev1));
        store = mockStore(getInitialState());
        updateStore(store);
        store.dispatch(await preloadStore());

        const load2 = store.getState();
        // device deleted, dev2 and dev2Instance1 should still be there
        const load2DevicesCount = selectDevicesCount(load2);
        expect(load2DevicesCount).toEqual(2);
        expect(load2.device.devices[0]).toEqual({ ...dev2, path: '' });

        // txs deleted
        const deletedAcc1Txs = getAccountTransactions(
            acc1.key,
            load2.wallet.transactions.transactions,
        );
        expect(deletedAcc1Txs.length).toEqual(0);
        // send form deleted
        expect(load2.wallet.send.drafts).toEqual({});
        // acc1 deleted
        expect(load2.wallet.accounts.length).toEqual(1);
        expect(load2.wallet.accounts[0].deviceState).toEqual(dev2.state?.staticSessionId);
        // forget device dev1 along with its instances
        await store.dispatch(storageActions.forgetDevice(dev2));
        await store.dispatch(storageActions.forgetDevice(dev2Instance1));
        store.dispatch(await preloadStore());
        expect(selectDevicesCount(store.getState())).toEqual(0);
    });

    it('should remove all txs for the acc', async () => {
        let store = mockStore(
            getInitialState({
                device: {
                    devices: [dev1, dev2],
                    persistentDeviceData: [],
                    isConnectionModalOpen: false,
                    defaultConnectionMode: 'cable',
                },
                wallet: {
                    accounts: [acc1, acc2],
                },
            }),
        );
        updateStore(store);

        // add txs
        store.dispatch(transactionsActions.addTransaction({ transactions: [tx1], account: acc1 }));
        store.dispatch(transactionsActions.addTransaction({ transactions: [tx2], account: acc2 }));

        // store in db
        await store.dispatch(storageActions.rememberDevice(dev1));
        await store.dispatch(storageActions.rememberDevice(dev2));

        // remove txs for acc 1
        await storageActions.removeAccountTransactions(acc1);
        store = mockStore(getInitialState());
        updateStore(store);
        store.dispatch(await preloadStore());

        const state = store.getState();

        // acc1 txs should be deleted
        const acc1Txs = getAccountTransactions(acc1.key, state.wallet.transactions.transactions);
        expect(acc1Txs.length).toEqual(0);

        // acc2 txs are still there
        const acc2Txs = getAccountTransactions(acc2.key, state.wallet.transactions.transactions);
        expect(acc2Txs.length).toEqual(1);
        await store.dispatch(storageActions.forgetDevice(dev1));
        await store.dispatch(storageActions.forgetDevice(dev2));
    });

    it('should update device settings in the db', async () => {
        // device needs to be connected otherwise devices reducer doesn't update the device
        const dev1Connected = { ...dev1, connected: true } as const;
        const store = mockStore(
            getInitialState({
                device: {
                    devices: [dev1Connected],
                    persistentDeviceData: [],
                    isConnectionModalOpen: false,
                    defaultConnectionMode: 'cable',
                },
                wallet: {
                    accounts: [acc1],
                },
            }),
        );
        updateStore(store);

        // store device in db
        await store.dispatch(storageActions.rememberDevice(dev1));

        // Change device label inside a reducer. This is a plain action, and storageMiddleware updates the db.
        await store.dispatch(
            deviceActions.updateSelectedDevice({
                ...(dev1Connected as AcquiredDevice),
                label: 'New Label',
            }),
        );

        // Hack - because the db operation is done in a middleware, it is not awaitable via dispatch
        await new Promise(resolve => setTimeout(resolve, 100));
        store.dispatch(await preloadStore());
        expect(selectDevices(store.getState())[0].label).toBe('New Label');
    });

    it('should store graph data with the device and remove it on ACCOUNT.REMOVE (triggered by disabling the coin)', async () => {
        const accLtc = mockWalletAccount({
            deviceState: dev1.state!.staticSessionId!,
            symbol: 'ltc',
            descriptor: asAccountDescriptor('desc2'),
        });

        const store = mockStore(
            getInitialState({
                device: {
                    devices: [dev1],
                    persistentDeviceData: [],
                    isConnectionModalOpen: false,
                    defaultConnectionMode: 'cable',
                },
                wallet: {
                    accounts: [acc1, accLtc],
                    graph: {
                        data: [
                            {
                                account: getAccountIdentifier(acc1),
                                error: false,
                                isLoading: false,
                                data: [],
                            },
                            {
                                account: getAccountIdentifier(accLtc),
                                error: false,
                                isLoading: false,
                                data: [],
                            },
                        ],
                        selectedRange: SETTINGS.DEFAULT_GRAPH_RANGE,
                        selectedView: 'linear',
                        error: null,
                        isLoading: false,
                    },
                },
            }),
        );
        updateStore(store);
        // store device in db
        await store.dispatch(storageActions.rememberDevice(dev1));

        // verify that graph data are stored
        store.dispatch(await preloadStore());
        expect(store.getState().wallet.graph.data.length).toBe(2);

        // disable btc network, enable ltc, triggering ACCOUNT.REMOVE
        await store.dispatch(changeCoinVisibility({ symbol: 'ltc', shouldBeVisible: true }));
        await store.dispatch(changeCoinVisibility({ symbol: 'btc', shouldBeVisible: false }));

        // verify that graph data for acc1 were removed
        store.dispatch(await preloadStore());
        expect(store.getState().wallet.graph.data.length).toBe(1);
        expect(store.getState().wallet.graph.data[0].account.symbol).toBe('ltc');
    });

    it('should store SuiteSyncOwner on setSuiteSyncOwner and remove it on forgetDevice', async () => {
        const owner = asEncryptedHex<SuiteSyncOwnerSerialized>('owner-key');
        const deviceStaticId = dev1.state!.staticSessionId!;
        const store = mockStore(getInitialState());
        updateStore(store);

        store.dispatch(
            setSuiteSyncOwner({
                deviceStaticId,
                owner,
            }),
        );

        await new Promise(resolve => setTimeout(resolve, 100));

        expect(await db.getItemByPK('suiteSyncOwners', deviceStaticId)).toEqual('owner-key');

        await store.dispatch(storageActions.forgetDevice(dev1));

        expect(await db.getItemByPK('suiteSyncOwners', deviceStaticId)).toBeUndefined();
    });
});

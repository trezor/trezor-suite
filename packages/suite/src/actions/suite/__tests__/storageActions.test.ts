import { Middleware } from 'redux';

import { testMocks } from '@suite-common/test-utils';
import {
    prepareDeviceReducer,
    selectDevices,
    selectDevicesCount,
    prepareDiscoveryReducer,
    disableAccountsThunk,
    transactionsActions,
    createDiscoveryThunk,
    deviceActions,
} from '@suite-common/wallet-core';
import * as discoveryActions from '@suite-common/wallet-core';
import { getAccountTransactions, getAccountIdentifier } from '@suite-common/wallet-utils';

import * as walletSettingsActions from 'src/actions/settings/walletSettingsActions';
import { accountsReducer, fiatRatesReducer, transactionsReducer } from 'src/reducers/wallet';
import walletSettingsReducer from 'src/reducers/wallet/settingsReducer';
import suiteReducer from 'src/reducers/suite/suiteReducer';
import sendFormReducer from 'src/reducers/wallet/sendFormReducer';
import graphReducer from 'src/reducers/wallet/graphReducer';
import storageMiddleware from 'src/middlewares/wallet/storageMiddleware';
import { coinjoinReducer } from 'src/reducers/wallet/coinjoinReducer';
import { configureStore } from 'src/support/tests/configureStore';
import { AppState } from 'src/types/suite';
import { SETTINGS } from 'src/config/suite';
import { preloadStore } from 'src/support/suite/preloadStore';
import { extraDependencies } from 'src/support/extraDependencies';

import * as suiteActions from '../suiteActions';
import * as storageActions from '../storageActions';

const { getSuiteDevice, getWalletAccount, getWalletTransaction } = testMocks;

const discoveryReducer = prepareDiscoveryReducer(extraDependencies);
const deviceReducer = prepareDeviceReducer(extraDependencies);

// TODO: add method in suite-storage for deleting all stored data (done as a static method on SuiteDB), call it after each test
// TODO: test deleting device instances on parent device forget

const dev1 = getSuiteDevice({
    state: 'state1',
    path: '1',
    instance: 1,
    remember: true, // normally it would be set by SUITE.REMEMBER_DEVICE dispatched from modalActions.onRememberDevice()
});
const dev2 = getSuiteDevice({
    state: 'state2',
    path: '2',
    instance: 1,
    remember: true, // normally it would be set by SUITE.REMEMBER_DEVICE dispatched from modalActions.onRememberDevice()
});
const dev2Instance1 = getSuiteDevice({
    state: 'state3',
    path: '2',
    instance: 2,
    remember: true, // normally it would be set by SUITE.REMEMBER_DEVICE dispatched from modalActions.onRememberDevice()
});
const devNotRemembered = getSuiteDevice({
    state: 'state1',
    path: '1',
    instance: 1,
});

const acc1 = getWalletAccount({
    deviceState: dev1.state,
    symbol: 'btc',
    descriptor: 'desc1',
    key: `desc1-btc-${dev1.state}`,
    networkType: 'bitcoin',
});
const acc2 = getWalletAccount({
    deviceState: dev2.state,
    symbol: 'btc',
    descriptor: 'desc2',
    key: `desc2-btc-${dev2.state}`,
    networkType: 'bitcoin',
});

const tx1 = getWalletTransaction({
    deviceState: dev1.state,
    txid: 'txid1',
    descriptor: 'desc1',
    symbol: 'btc',
});
const tx2 = getWalletTransaction({
    deviceState: dev2.state,
    txid: 'txid2',
    descriptor: 'desc2',
    symbol: 'btc',
});

type PartialState = Pick<AppState, 'suite' | 'device'> & {
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

export const getInitialState = (prevState?: Partial<PartialState>, action?: any) => ({
    suite: suiteReducer(
        prevState ? prevState.suite : undefined,
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
const middlewares: Middleware<any, any>[] = [storageMiddleware];

const mockStore = configureStore<State, any>(middlewares);

type mockStoreType = ReturnType<typeof mockStore>;

const updateStore = (store: mockStoreType) => {
    store.subscribe(() => {
        const action = store.getActions().pop();
        const prevState = store.getState();
        store.getState().suite = getInitialState(prevState, action).suite;
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
        await store.dispatch(walletSettingsActions.setLocalCurrency('czk'));
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
        await store.dispatch(suiteActions.initialRunCompleted());
        store.dispatch(await preloadStore());

        expect(store.getState().suite.flags.initialRun).toEqual(false);
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

        await storageActions.removeDraft('account-key');
        store = mockStore(getInitialState());
        updateStore(store);
        store.dispatch(await preloadStore());
        expect(store.getState().wallet.send.drafts).toEqual({});
    });

    it('should store remembered device', async () => {
        let store = mockStore(
            getInitialState({
                device: { devices: [dev1, dev2, dev2Instance1] },
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

        // create discovery objects
        store.dispatch(createDiscoveryThunk({ deviceState: dev1.state!, device: dev1 }));
        store.dispatch(createDiscoveryThunk({ deviceState: dev2.state!, device: dev2 }));
        store.dispatch(
            createDiscoveryThunk({
                deviceState: dev2Instance1.state!,
                device: dev2Instance1,
            }),
        );

        // add txs
        store.dispatch(transactionsActions.addTransaction({ transactions: [tx1], account: acc1 }));
        store.dispatch(transactionsActions.addTransaction({ transactions: [tx2], account: acc2 }));

        // remember devices
        await store.dispatch(storageActions.rememberDevice(dev1, true));
        await store.dispatch(storageActions.rememberDevice(dev2, true));
        await store.dispatch(storageActions.rememberDevice(dev2Instance1, true));

        // update discovery object
        store.dispatch(
            discoveryActions.updateDiscovery({
                deviceState: dev2.state!,
                networks: ['btc', 'ltc'],
            }),
        );

        store.dispatch(await preloadStore());

        // stored devices
        const load1 = store.getState();
        const load1DevicesCount = selectDevicesCount(load1);
        expect(load1DevicesCount).toEqual(3);
        expect(load1.device.devices[0]).toEqual({ ...dev1, path: '' });

        // stored discoveries
        const storedDiscovery = load1.wallet.discovery;
        // all 3 discoveries saved
        expect(storedDiscovery.length).toEqual(3);
        expect(storedDiscovery.find((d: any) => d.deviceState === dev1.state!)).toBeTruthy();
        expect(storedDiscovery.find((d: any) => d.deviceState === dev2.state!)).toBeTruthy();
        expect(
            storedDiscovery.find((d: any) => d.deviceState === dev2Instance1.state!),
        ).toBeTruthy();

        // discovery updated synced
        expect(
            storedDiscovery.find((d: any) => d.deviceState === dev2.state)?.networks,
        ).toStrictEqual(['btc', 'ltc']);

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

        // discovery object for dev1 deleted
        expect(load2.wallet.discovery.length).toEqual(2);
        expect(
            load2.wallet.discovery.find((d: any) => d.deviceState === dev1.state!),
        ).toBeUndefined();

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
        expect(load2.wallet.accounts[0].deviceState).toEqual(dev2.state);
        // forget device dev1 along with its instances
        await store.dispatch(storageActions.rememberDevice(dev2, false));
        await store.dispatch(storageActions.rememberDevice(dev2Instance1, false));
        store.dispatch(await preloadStore());
        expect(selectDevicesCount(store.getState())).toEqual(0);
    });

    it('should remove all txs for the acc', async () => {
        let store = mockStore(
            getInitialState({
                device: {
                    devices: [dev1, dev2],
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
        await store.dispatch(storageActions.rememberDevice(dev1, true));
        await store.dispatch(storageActions.rememberDevice(dev2, true));

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
                },
                wallet: {
                    accounts: [acc1],
                },
            }),
        );
        updateStore(store);

        // store device in db
        await store.dispatch(storageActions.rememberDevice(dev1, true));

        // Change device label inside a reducer
        await store.dispatch(
            deviceActions.updateSelectedDevice({
                ...dev1Connected,
                label: 'New Label',
            }),
        );

        store.dispatch(await preloadStore());
        expect(selectDevices(store.getState())[0].label).toBe('New Label');
    });

    it('should store graph data with the device and remove it on ACCOUNT.REMOVE (triggered by disabling the coin)', async () => {
        const accLtc = getWalletAccount({
            deviceState: dev1.state,
            symbol: 'ltc',
            descriptor: 'desc2',
            key: `desc2-ltc-${dev1.state}`,
            networkType: 'bitcoin',
        });

        const store = mockStore(
            getInitialState({
                device: { devices: [dev1] },
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
        await store.dispatch(storageActions.rememberDevice(dev1, true));

        // verify that graph data are stored
        store.dispatch(await preloadStore());
        expect(store.getState().wallet.graph.data.length).toBe(2);

        // disable btc network, enable ltc
        await store.dispatch(walletSettingsActions.changeNetworks(['ltc']));
        // remove accounts belonging to disabled coins, triggering ACCOUNT.REMOVE
        await store.dispatch(disableAccountsThunk());

        // verify that graph data for acc1 were removed
        store.dispatch(await preloadStore());
        expect(store.getState().wallet.graph.data.length).toBe(1);
        expect(store.getState().wallet.graph.data[0].account.symbol).toBe('ltc');
    });

    it('remember device with forceRemember', async () => {
        const store = mockStore(
            getInitialState({
                device: {
                    devices: [devNotRemembered],
                },
            }),
        );
        updateStore(store);

        // store in db
        await store.dispatch(storageActions.rememberDevice(devNotRemembered, true, true));
        store.dispatch(await preloadStore());
        expect(selectDevices(store.getState())[0].remember).toBe(true);
        expect(selectDevices(store.getState())[0].forceRemember).toBe(true);
    });
});

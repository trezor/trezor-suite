import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { Middleware } from 'redux';
import * as storageActions from '../storageActions';
import * as suiteActions from '../suiteActions';
import * as languageActions from '../../settings/languageActions';
import * as walletSettingsActions from '@settings-actions/walletSettingsActions';
import * as transactionActions from '@wallet-actions/transactionActions';
import * as discoveryActions from '@wallet-actions/discoveryActions';
import * as accountActions from '@wallet-actions/accountActions';
import * as SUITE from '@suite-actions/constants/suiteConstants';

import accountsReducer from '@wallet-reducers/accountsReducer';
import walletSettingsReducer from '@wallet-reducers/settingsReducer';
import suiteReducer from '@suite-reducers/suiteReducer';
import deviceReducer from '@suite-reducers/deviceReducer';
import discoveryReducer from '@wallet-reducers/discoveryReducer';
import sendFormReducer from '@wallet-reducers/sendFormReducer';
import graphReducer from '@wallet-reducers/graphReducer';
import transactionsReducer from '@wallet-reducers/transactionReducer';
import fiatRatesReducer from '@wallet-reducers/fiatRatesReducer';
import storageMiddleware from '@wallet-middlewares/storageMiddleware';
import { getAccountTransactions, getAccountIdentifier } from '@wallet-utils/accountUtils';
import { AppState } from '@suite-types';
// in-memory implementation of indexedDB
import 'fake-indexeddb/auto';
import { SETTINGS } from '@suite/config/suite';

const { getSuiteDevice, getWalletAccount, getWalletTransaction } = global.JestMocks;

// TODO: add method in suite-storage for deleting all stored data (done as a static method on SuiteDB), call it after each test
// TODO: test deleting device instances on parent device forget

// HACK: suite-storage has as a react-native version of the lib as a 'main' entry in package.json
// It is a hacky 'solution' to prevent TSC in suite-native from throwing errors on IDB.
// Path to the web version is in 'browser' field. Jest loads the lib from the main entry (and that is fine).
// This essentially replaces the react-native version of the lib with web version.
jest.mock('@trezor/suite-storage', () => {
    return {
        __esModule: true,
        ...(jest.requireActual('@trezor/suite-storage/lib/web/index') as object), // cast so ts stops complaining
    };
});

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

const acc1 = getWalletAccount({
    deviceState: dev1.state,
    symbol: 'btc',
    descriptor: 'desc1',
    networkType: 'bitcoin',
});
const acc2 = getWalletAccount({
    deviceState: dev2.state,
    symbol: 'btc',
    descriptor: 'desc2',
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

type PartialState = Pick<AppState, 'suite' | 'devices'> & {
    wallet: Partial<
        Pick<
            AppState['wallet'],
            'accounts' | 'settings' | 'discovery' | 'send' | 'transactions' | 'graph' | 'fiat'
        >
    >;
};

export const getInitialState = (prevState?: Partial<PartialState>, action?: any) => ({
    suite: suiteReducer(
        prevState ? prevState.suite : undefined,
        action || ({ type: 'foo' } as any),
    ),
    devices: deviceReducer(
        prevState ? prevState.devices : undefined,
        action || ({ type: 'foo' } as any),
    ),
    wallet: {
        accounts: accountsReducer(
            prevState && prevState.wallet ? prevState.wallet.accounts : undefined,
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
    },
});

type State = ReturnType<typeof getInitialState>;
const middlewares: Middleware<any, any>[] = [thunk, storageMiddleware];

const mockStore = configureStore<State, any>(middlewares);

type mockStoreType = ReturnType<typeof mockStore>;

const updateStore = (store: mockStoreType) => {
    store.subscribe(() => {
        const action = store.getActions().pop();
        const prevState = store.getState();
        store.getState().suite = getInitialState(prevState, action).suite;
        store.getState().devices = getInitialState(prevState, action).devices;
        store.getState().wallet = getInitialState(prevState, action).wallet;
        store.getActions().push(action);
    });
};

const getLastAction = (store: mockStoreType) => {
    const actions = store.getActions();
    const lastAction = actions[actions.length - 1];
    return lastAction;
};

const mockFetch = (data: any) => {
    return jest.fn().mockImplementation(() =>
        Promise.resolve({
            ok: true,
            json: () => data,
        }),
    );
};

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
        // triggers SUITE.LOADED action with objects from the DB inside the payload prop
        await store.dispatch(storageActions.loadStorage());

        // check if stored local currency is 'czk'
        expect(getLastAction(store).payload.wallet.settings.localCurrency).toEqual('czk');
        // compare stored settings object with one in the reducer
        expect(getLastAction(store).payload.wallet.settings).toEqual(settings);
    });

    it('should store suite settings in the db and update them automatically', async () => {
        const store = mockStore(getInitialState());
        updateStore(store);
        // @ts-ignore
        const f = global.fetch;
        // @ts-ignore
        global.fetch = mockFetch({ TR_ID: 'Message' });
        await store.dispatch(storageActions.saveSuiteSettings());
        await store.dispatch(languageActions.fetchLocale('cs'));
        await store.dispatch(suiteActions.initialRunCompleted());
        await store.dispatch(storageActions.loadStorage());

        expect(getLastAction(store).payload.suite.settings.language).toEqual('cs');
        expect(getLastAction(store).payload.suite.flags.initialRun).toEqual(false);
        // @ts-ignore
        global.fetch = f;
    });

    it('should store and retrieve send form', async () => {
        const store = mockStore(getInitialState());
        updateStore(store);

        const send = {
            deviceState: 'state',
            isFake: true,
        };

        // @ts-ignore
        await storageActions.saveSendForm(send, 'key1');
        const storedSend = await storageActions.loadSendForm('key1');

        expect(storedSend).toEqual(send);
    });

    it('should override stored form', async () => {
        const store = mockStore(getInitialState());
        updateStore(store);

        const send = {
            deviceState: 'state',
            isFake: true,
        };

        const send2 = {
            deviceState: 'state',
            isFake: false,
        };

        // @ts-ignore
        await storageActions.saveSendForm(send, 'key1');
        // @ts-ignore
        await storageActions.saveSendForm(send2, 'key1');
        const storedSend = await storageActions.loadSendForm('key1');

        expect(storedSend).toEqual(send2);
    });

    it('should store and remove send form', async () => {
        const store = mockStore(getInitialState());
        updateStore(store);

        const send = {
            deviceState: 'state',
            isFake: true,
        };

        // @ts-ignore
        await storageActions.saveSendForm(send, 'key1');
        const storedSend = await storageActions.loadSendForm('key1');
        await storageActions.removeSendForm('key1');
        const storedSend2 = await storageActions.loadSendForm('key1');

        expect(storedSend).toEqual(send);
        expect(storedSend2).toEqual(undefined);
    });

    it('should store remembered device', async () => {
        const store = mockStore(
            getInitialState({
                devices: [dev1, dev2, dev2Instance1],
                wallet: {
                    accounts: [acc1, acc2],
                },
            }),
        );
        updateStore(store);

        const send = {
            deviceState: dev1.state,
            isFake: true,
        };

        // store send form for dev1
        // @ts-ignore
        await storageActions.saveSendForm(send, dev1.state);
        const storedSend = await storageActions.loadSendForm(dev1.state!);
        expect(storedSend).toEqual(send);

        // create discovery objects
        store.dispatch(discoveryActions.create(dev1.state!, dev1));
        store.dispatch(discoveryActions.create(dev2.state!, dev2));
        store.dispatch(discoveryActions.create(dev2Instance1.state!, dev2Instance1));

        // add txs
        store.dispatch(transactionActions.add([tx1], acc1));
        store.dispatch(transactionActions.add([tx2], acc2));

        // remember devices
        await store.dispatch(storageActions.rememberDevice(dev1, true));
        await store.dispatch(storageActions.rememberDevice(dev2, true));
        await store.dispatch(storageActions.rememberDevice(dev2Instance1, true));

        // update discovery object
        store.dispatch(
            discoveryActions.update({
                deviceState: dev2.state!,
                networks: ['btc', 'ltc'],
            }),
        );

        await store.dispatch(storageActions.loadStorage());

        // stored devices
        const loadFromStorageAction = getLastAction(store);
        expect(loadFromStorageAction.payload.devices.length).toEqual(3);
        expect(loadFromStorageAction.payload.devices[0]).toEqual({ ...dev1, path: '' });

        // stored discoveries
        const storedDiscovery = loadFromStorageAction.payload.wallet.discovery;
        // all 3 discoveries saved
        expect(storedDiscovery.length).toEqual(3);
        expect(storedDiscovery.find((d: any) => d.deviceState === dev1.state!)).toBeTruthy();
        expect(storedDiscovery.find((d: any) => d.deviceState === dev2.state!)).toBeTruthy();
        expect(
            storedDiscovery.find((d: any) => d.deviceState === dev2Instance1.state!),
        ).toBeTruthy();

        // discovery updated synced
        expect(
            storedDiscovery.find((d: any) => d.deviceState === dev2.state!)?.networks,
        ).toStrictEqual(['btc', 'ltc']);

        // stored txs
        const acc1Txs = getAccountTransactions(
            loadFromStorageAction.payload.wallet.transactions.transactions,
            acc1,
        );

        expect(acc1Txs.length).toEqual(1);
        expect(acc1Txs[0].deviceState).toEqual(tx1.deviceState);
        // stored accounts
        expect(loadFromStorageAction.payload.wallet.accounts.length).toEqual(2);
        expect(loadFromStorageAction.payload.wallet.accounts[0]).toEqual(acc1);

        // stored device2
        expect(loadFromStorageAction.payload.devices[1].state).toEqual(dev2.state);
        // stored txs
        const acc2Txs = getAccountTransactions(
            loadFromStorageAction.payload.wallet.transactions.transactions,
            acc2,
        );

        expect(acc2Txs.length).toEqual(1);
        expect(acc2Txs[0].deviceState).toEqual(tx2.deviceState);
        // stored 1 account
        expect(loadFromStorageAction.payload.wallet.accounts[1]).toEqual(acc2);

        // forget dev1
        await store.dispatch(storageActions.forgetDevice(dev1));
        await store.dispatch(storageActions.loadStorage());

        // device deleted, dev2 and dev2Instance1 should still be there
        expect(getLastAction(store).payload.devices.length).toEqual(2);
        expect(getLastAction(store).payload.devices[0]).toEqual({ ...dev2, path: '' });

        // discovery object for dev1 deleted
        expect(getLastAction(store).payload.wallet.discovery.length).toEqual(2);
        expect(
            getLastAction(store).payload.wallet.discovery.find(
                (d: any) => d.deviceState === dev1.state!,
            ),
        ).toBeUndefined();

        // txs deleted
        const deletedAcc1Txs = getAccountTransactions(
            getLastAction(store).payload.wallet.transactions.transactions,
            acc1,
        );
        expect(deletedAcc1Txs.length).toEqual(0);
        // send form deleted
        const deletedStoredSend = await storageActions.loadSendForm(dev1.state!);
        expect(deletedStoredSend).toEqual(undefined);
        // acc1 deleted
        expect(getLastAction(store).payload.wallet.accounts.length).toEqual(1);
        expect(getLastAction(store).payload.wallet.accounts[0].deviceState).toEqual(dev2.state);
        // forget device dev1 along with its instances
        await store.dispatch(storageActions.rememberDevice(dev2, false));
        await store.dispatch(storageActions.rememberDevice(dev2Instance1, false));
        await store.dispatch(storageActions.loadStorage());
        expect(getLastAction(store).payload.devices.length).toEqual(0);
    });

    it('should remove all txs for the acc', async () => {
        const store = mockStore(
            getInitialState({
                devices: [dev1, dev2],
                wallet: {
                    accounts: [acc1, acc2],
                },
            }),
        );
        updateStore(store);

        // add txs
        store.dispatch(transactionActions.add([tx1], acc1));
        store.dispatch(transactionActions.add([tx2], acc2));

        // store in db
        await store.dispatch(storageActions.rememberDevice(dev1, true));
        await store.dispatch(storageActions.rememberDevice(dev2, true));

        // remove txs for acc 1
        await storageActions.removeAccountTransactions(acc1);

        await store.dispatch(storageActions.loadStorage());

        // acc1 txs should be deleted
        const acc1Txs = getAccountTransactions(
            getLastAction(store).payload.wallet.transactions.transactions,
            acc1,
        );
        expect(acc1Txs.length).toEqual(0);

        // acc2 txs are still there
        const acc2Txs = getAccountTransactions(
            getLastAction(store).payload.wallet.transactions.transactions,
            acc2,
        );
        expect(acc2Txs.length).toEqual(1);
        await store.dispatch(storageActions.forgetDevice(dev1));
        await store.dispatch(storageActions.forgetDevice(dev2));
    });

    it('should update device settings in the db', async () => {
        // device needs to be connected otherwise devices reducer doesn't update the device
        const dev1Connected = { ...dev1, connected: true } as const;
        const store = mockStore(
            getInitialState({
                devices: [dev1Connected],

                wallet: {
                    accounts: [acc1],
                },
            }),
        );
        updateStore(store);

        // store device in db
        await store.dispatch(storageActions.rememberDevice(dev1, true));

        // Change device label inside a reducer
        await store.dispatch({
            type: SUITE.UPDATE_SELECTED_DEVICE,
            payload: {
                ...dev1Connected,
                label: 'New Label',
            },
        });

        await store.dispatch(storageActions.loadStorage());
        const dev = getLastAction(store).payload.devices[0];
        expect(dev.label).toBe('New Label');
    });

    it('should store graph data with the device and remove it on ACCOUNT.REMOVE (triggered by disabling the coin)', async () => {
        const accLtc = getWalletAccount({
            deviceState: dev1.state,
            symbol: 'ltc',
            descriptor: 'desc2',
            networkType: 'bitcoin',
        });

        const store = mockStore(
            getInitialState({
                devices: [dev1],
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
        await store.dispatch(storageActions.loadStorage());
        expect(getLastAction(store).payload.wallet.graph.data.length).toBe(2);

        // disable btc network, enable ltc
        await store.dispatch(walletSettingsActions.changeNetworks(['ltc']));
        // remove accounts belonging to disabled coins, triggering ACCOUNT.REMOVE
        await store.dispatch(accountActions.disableAccounts());

        // verify that graph data for acc1 were removed
        await store.dispatch(storageActions.loadStorage());
        expect(getLastAction(store).payload.wallet.graph.data.length).toBe(1);
        expect(getLastAction(store).payload.wallet.graph.data[0].account.symbol).toBe('ltc');
    });
});

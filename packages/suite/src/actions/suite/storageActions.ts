import { db } from '@suite/storage';
import SuiteDB from '@trezor/suite-storage';
import { STORAGE } from './constants';
import { Dispatch, GetState, AppState, TrezorDevice } from '@suite-types';
import { Account } from '@wallet-types';
import { getAccountKey } from '@wallet-utils/accountUtils';
import { State as SendFormState } from '@wallet-types/sendForm';
import { getDeviceInstances } from '@suite-utils/device';
import { Discovery } from '@wallet-reducers/discoveryReducer';
import { serializeDiscovery } from '@suite-utils/storage';

export type StorageActions =
    | { type: typeof STORAGE.LOAD }
    | { type: typeof STORAGE.LOADED; payload: AppState }
    | { type: typeof STORAGE.ERROR; error: any };

export const saveSendForm = async (saveSendFormState: SendFormState, accountKey: string) => {
    return db.addItem('sendForm', saveSendFormState, accountKey);
};

export const loadSendForm = async (accountKey: string) => {
    return db.getItemByPK('sendForm', accountKey);
};

export const removeSendForm = async (accountKey: string) => {
    return db.removeItemByPK('sendForm', accountKey);
};

export const saveDevice = async (device: TrezorDevice) => {
    if (!device || !device.features || !device.remember) return;
    return db.addItem('devices', { ...device, path: '', connected: false }, device.state);
};

export const removeAccount = async (account: Account) => {
    return db.removeItemByPK('accounts', [account.descriptor, account.symbol, account.deviceState]);
};

export const removeAccountTransactions = async (account: Account) => {
    await db.removeItemByIndex('txs', 'accountKey', [
        account.descriptor,
        account.symbol,
        account.deviceState,
    ]);
};

export const saveAccounts = async (accounts: Account[]) => {
    return db.addItems('accounts', accounts, true);
};

export const saveDiscovery = async (discoveries: Discovery[]) => {
    return db.addItems('discovery', discoveries, true);
};

export const saveAccountTransactions = (account: Account) => async (
    _dispatch: Dispatch,
    getState: GetState,
) => {
    const allTxs = getState().wallet.transactions.transactions;
    const accTxs =
        allTxs[getAccountKey(account.descriptor, account.symbol, account.deviceState)] || [];

    // wrap txs and add its order inside the array
    const orderedTxs = accTxs.map((accTx, i) => ({
        tx: accTx,
        order: i,
    }));
    return db.addItems('txs', orderedTxs, true);
};

export const rememberDevice = (device: TrezorDevice) => async (
    dispatch: Dispatch,
    getState: GetState,
) => {
    if (!device || !device.features || !device.state) return;
    const { wallet, devices } = getState();
    const instances = getDeviceInstances(device, devices);

    const promises = instances.map(instance => {
        const accounts = wallet.accounts.filter(a => a.deviceState === instance.state);
        const discovery = wallet.discovery.filter(d => d.deviceState === instance.state);
        // trim promise function from discovery object
        const serializableDiscovery = discovery.map(d => serializeDiscovery(d));
        const txsPromises = accounts.map(acc => {
            return dispatch(saveAccountTransactions(acc));
        });

        return Promise.all([
            saveDevice(instance),
            saveAccounts(accounts),
            saveDiscovery(serializableDiscovery),
            ...txsPromises,
        ] as Promise<void | string | undefined>[]);
    });

    try {
        await Promise.all(promises);
    } catch (error) {
        if (error) {
            console.error('errorName', error.name);
            console.error('errorMessage', error.message);
        } else {
            console.error('error', error);
        }
    }
};

export const forgetDeviceInstance = (device: TrezorDevice) => async (
    _dispatch: Dispatch,
    _getState: GetState,
) => {
    if (!device.state) return;
    const promises = await Promise.all([
        db.removeItemByPK('devices', device.state),
        db.removeItemByIndex('accounts', 'deviceState', device.state),
        db.removeItemByPK('discovery', device.state),
        db.removeItemByIndex('txs', 'deviceState', device.state),
        db.removeItemByIndex('sendForm', 'deviceState', device.state),
    ]);
    return promises;
};

export const forgetDevice = (device: TrezorDevice) => async (
    dispatch: Dispatch,
    _getState: GetState,
) => {
    if (!device.state) return;
    // get all device instances
    const storedDevices = await db.getItemsExtended('devices');
    const deviceInstances = getDeviceInstances(device, storedDevices);
    const promises = deviceInstances.map(instance => dispatch(forgetDeviceInstance(instance)));
    await Promise.all(promises);
};

export const saveWalletSettings = () => async (_dispatch: Dispatch, getState: GetState) => {
    await db.addItem(
        'walletSettings',
        {
            ...getState().wallet.settings,
        },
        'wallet',
    );
};

export const saveFiatRates = () => (_dispatch: Dispatch, getState: GetState) => {
    return db.addItems('fiatRates', getState().wallet.fiat, true);
};

export const saveSuiteSettings = () => (_dispatch: Dispatch, getState: GetState) => {
    const { suite } = getState();
    db.addItem(
        'suiteSettings',
        {
            language: suite.language,
            initialRun: suite.initialRun,
        },
        'suite',
    );
};

export const loadStorage = () => async (dispatch: Dispatch, getState: GetState) => {
    const isDBAvailable = await SuiteDB.isDBAvailable();

    if (!isDBAvailable) {
        // console.warn('IndexedDB not supported');
        const initialState = getState();
        dispatch({
            type: STORAGE.LOADED,
            payload: {
                ...initialState,
            },
        });
    } else {
        //  load state from database
        const suite = await db.getItemByPK('suiteSettings', 'suite');
        const devices = await db.getItemsExtended('devices');
        const accounts = await db.getItemsExtended('accounts');
        const discovery = await db.getItemsExtended('discovery');
        const walletSettings = await db.getItemByPK('walletSettings', 'wallet');
        const fiatRates = await db.getItemsExtended('fiatRates');

        const txs = await db.getItemsExtended('txs', 'order');

        const mappedTxs: AppState['wallet']['transactions']['transactions'] = {};
        txs.forEach(item => {
            const k = getAccountKey(item.tx.descriptor, item.tx.symbol, item.tx.deviceState);
            if (!mappedTxs[k]) {
                mappedTxs[k] = [];
            }
            mappedTxs[k][item.order] = item.tx;
        });

        const initialState = getState();
        dispatch({
            type: STORAGE.LOADED,
            payload: {
                ...initialState,
                suite: {
                    ...initialState.suite,
                    ...suite,
                },
                devices,
                wallet: {
                    ...initialState.wallet,
                    settings: {
                        ...initialState.wallet.settings,
                        ...walletSettings,
                    },
                    accounts,
                    discovery,
                    transactions: {
                        ...initialState.wallet.transactions,
                        transactions: mappedTxs,
                    },
                    fiat: fiatRates || [],
                },
            },
        });
    }
};

import { db } from '@suite/storage';
import SuiteDB from '@trezor/suite-storage';
import { STORAGE } from './constants';
import { Dispatch, GetState, AppState, TrezorDevice } from '@suite-types';
import { Account, Send } from '@wallet-types';
import { getAccountKey } from '@wallet-utils/accountUtils';
import { Discovery } from '@wallet-reducers/discoveryReducer';
import * as notificationActions from '@suite-actions/notificationActions';
import { serializeDiscovery, serializeDevice } from '@suite-utils/storage';

export type StorageActions =
    | { type: typeof STORAGE.LOAD }
    | { type: typeof STORAGE.LOADED; payload: AppState }
    | { type: typeof STORAGE.ERROR; error: any };

export const saveSendForm = async (saveSendFormState: Send, accountKey: string) => {
    return db.addItem('sendForm', saveSendFormState, accountKey);
};

export const loadSendForm = async (accountKey: string) => {
    return db.getItemByPK('sendForm', accountKey);
};

export const removeSendForm = async (accountKey: string) => {
    return db.removeItemByPK('sendForm', accountKey);
};

export const saveDevice = async (device: TrezorDevice) => {
    if (!device || !device.features || !device.state) return;
    return db.addItem('devices', serializeDevice(device), device.state);
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

export const forgetDevice = (device: TrezorDevice) => async () => {
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

export const rememberDevice = (device: TrezorDevice, remember: boolean) => async (
    dispatch: Dispatch,
    getState: GetState,
) => {
    if (!device || !device.features || !device.state) return;
    if (!remember) {
        return dispatch(forgetDevice(device));
    }

    const { wallet } = getState();
    const accounts = wallet.accounts.filter(a => a.deviceState === device.state);
    const discovery = wallet.discovery
        .filter(d => d.deviceState === device.state)
        .map(serializeDiscovery);
    const txsPromises = accounts.map(acc => {
        return dispatch(saveAccountTransactions(acc));
    });

    try {
        await Promise.all([
            saveDevice(device),
            saveAccounts(accounts),
            saveDiscovery(discovery),
            ...txsPromises,
        ] as Promise<void | string | undefined>[]);
    } catch (error) {
        if (error) {
            console.error('errorName', error.name);
            console.error('errorMessage', error.message);
        } else {
            console.error('error', error);
        }
    }
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

export const removeFiatRate = (symbol: string) => (_dispatch: Dispatch, _getState: GetState) => {
    // TODO: just to be safe store and delete by compound index [symbol, mainNetworkSymbol]
    // check if it's fine to have mainNetworkSymbol undefined
    return db.removeItemByPK('fiatRates', symbol);
};

export const saveFiatRates = () => (_dispatch: Dispatch, getState: GetState) => {
    return db.addItems('fiatRates', getState().wallet.fiat, true);
};

export const saveSuiteSettings = () => (_dispatch: Dispatch, getState: GetState) => {
    const { suite } = getState();
    db.addItem(
        'suiteSettings',
        {
            settings: suite.settings,
            flags: suite.flags,
        },
        'suite',
    );
};

export const saveAnalytics = () => (_dispatch: Dispatch, getState: GetState) => {
    const { analytics } = getState();
    db.addItem(
        'analytics',
        {
            enabled: analytics.enabled,
            instanceId: analytics.instanceId,
        },
        'suite',
    );
};

export const clearStores = () => async (dispatch: Dispatch, _getState: GetState) => {
    await db.clearStores();
    dispatch(
        notificationActions.addToast({
            type: 'clear-storage',
        }),
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
        const analytics = await db.getItemByPK('analytics', 'suite');
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
                    flags: {
                        ...initialState.suite.flags,
                        ...suite?.flags,
                    },
                    settings: {
                        ...initialState.suite.settings,
                        ...suite?.settings,
                    },
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
                analytics: analytics ? { ...analytics } : initialState.analytics,
            },
        });
    }
};

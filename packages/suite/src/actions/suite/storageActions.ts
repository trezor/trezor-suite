import { db } from '@suite/storage';
import SuiteDB from '@trezor/suite-storage';
import { STORAGE } from './constants';
import { Dispatch, GetState, AppState, TrezorDevice } from '@suite-types';
import { Account } from '@wallet-types';
import { getAccountKey } from '@suite/utils/wallet/accountUtils';
import { State as SendFormState } from '@wallet-types/sendForm';

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

export const rememberDevice = (device: TrezorDevice) => async (
    _dispatch: Dispatch,
    getState: GetState,
) => {
    if (!device || !device.features || !device.state) return;
    const { wallet } = getState();
    const accounts = wallet.accounts.filter(a => a.deviceState === device.state);
    const discovery = wallet.discovery.filter(d => d.deviceState === device.state);
    // trim promise function from discovery object
    const serializableDiscovery = discovery.map(d => ({ ...d, running: undefined }));
    const allTxs = wallet.transactions.transactions;
    const transactions = accounts
        .map(a => allTxs[getAccountKey(a.descriptor, a.symbol, a.deviceState)] || [])
        .flat();

    // TODO: Jest get stuck on Promise.all

    // await Promise.all([
    //     db.addItem('devices', { ...device, remember: true, connected: false }, device.state),
    //     db.addItems('accounts', accounts, true),
    //     db.addItems('discovery', serializableDiscovery, true),
    //     db.addItems('txs', transactions, true),
    // ]).catch(error => {
    //     if (error) {
    //         console.error('errorName', error.name);
    //         console.error('errorMessage', error.message);
    //     } else {
    //         console.error('error', error);
    //     }
    // });
    try {
        await db.addItem('devices', { ...device, remember: true, connected: false }, device.state);
        await db.addItems('accounts', accounts, true);
        await db.addItems('discovery', serializableDiscovery, true);
        await db.addItems('txs', transactions, true);
    } catch (error) {
        if (error) {
            console.error('errorName', error.name);
            console.error('errorMessage', error.message);
        } else {
            console.error('error', error);
        }
    }
};

export const removeAccountTransactions = async (account: Account) => {
    await db.removeItemByIndex('txs', 'accountKey', [
        account.descriptor,
        account.symbol,
        account.deviceState,
    ]);
};

export const forgetDevice = (device: TrezorDevice) => async (
    _dispatch: Dispatch,
    _getState: GetState,
) => {
    if (!device.state) return;
    await Promise.all([
        db.removeItemByPK('devices', device.state),
        db.removeItemByIndex('accounts', 'deviceState', device.state),
        db.removeItemByPK('discovery', device.state),
        db.removeItemByIndex('txs', 'deviceState', device.state),
        db.removeItemByIndex('sendForm', 'deviceState', device.state),
    ]);
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
        console.warn('IndexedDB not supported');
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
        const txs = await db.getItemsExtended('txs');

        const mappedTxs: AppState['wallet']['transactions']['transactions'] = {};
        txs.forEach(tx => {
            const k = getAccountKey(tx.descriptor, tx.symbol, tx.deviceState);
            if (!mappedTxs[k]) {
                mappedTxs[k] = [];
            }
            mappedTxs[k].push(tx);
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
                },
            },
        });
    }
};

import { db } from '@suite/storage';
import SuiteDB from '@trezor/suite-storage';
import { STORAGE } from './constants';
import { Dispatch, GetState, AppState, TrezorDevice } from '@suite-types';
import { Account } from '@wallet-types';
import { getAccountKey } from '@suite/utils/wallet/accountUtils';
import { State as SendFormState } from '@wallet-types/sendForm';
import { getDeviceInstances } from '@suite/utils/suite/device';
import { Discovery } from '@suite/reducers/wallet/discoveryReducer';
import { WalletAccountTransaction } from '@suite/reducers/wallet/transactionReducer';
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
    if (!device || !device.features || !device.state) return;
    return db.addItem('devices', { ...device, remember: true, connected: false }, device.state);
};

export const removeAccount = async (account: Account, device: TrezorDevice) => {
    if (!device.state) return;
    return db.removeItemByPK('accounts', [account.descriptor, account.symbol, device.state]);
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

export const saveTransactions = async (transactions: WalletAccountTransaction[]) => {
    return db.addItems('txs', transactions, true);
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
    const serializableDiscovery = discovery.map(d => serializeDiscovery(d));
    const allTxs = wallet.transactions.transactions;
    const transactions = accounts
        .map(a => allTxs[getAccountKey(a.descriptor, a.symbol, a.deviceState)] || [])
        .flat();

    try {
        await Promise.all([
            saveDevice(device),
            saveAccounts(accounts),
            saveDiscovery(serializableDiscovery),
            saveTransactions(transactions),
        ]);
    } catch (error) {
        if (error) {
            console.error('errorName', error.name);
            console.error('errorMessage', error.message);
        } else {
            console.error('error', error);
        }
    }
};

export const forgetDevice = (device: TrezorDevice) => async (
    _dispatch: Dispatch,
    _getState: GetState,
) => {
    if (!device.state) return;

    // get all device instances
    const storedDevices = await db.getItemsExtended('devices');
    const deviceInstances = getDeviceInstances(device, storedDevices);

    await Promise.all([
        db.removeItemByPK('devices', device.state),
        deviceInstances.filter(d => !!d.state).map(d => db.removeItemByPK('devices', d.state!)),
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

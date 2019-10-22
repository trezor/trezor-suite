import { db } from '@suite/storage';
import SuiteDB from '@trezor/suite-storage';
import { STORAGE } from './constants';
import { Dispatch, GetState, AppState, TrezorDevice } from '@suite-types';

export type StorageActions =
    | { type: typeof STORAGE.LOAD }
    | { type: typeof STORAGE.LOADED; payload: AppState }
    | { type: typeof STORAGE.ERROR; error: any };

export const rememberDevice = (device: TrezorDevice) => async (
    _dispatch: Dispatch,
    getState: GetState,
) => {
    if (!device || !device.features || !device.state) return;
    const accounts = getState().wallet.accounts.filter(a => a.deviceState === device.state);
    const discovery = getState().wallet.discovery.filter(d => d.deviceState === device.state);
    // strip promise function from discovery object
    const serializableDiscovery = discovery.map(d => ({ ...d, running: undefined }));
    await Promise.all([
        db.addItem('devices', { ...device, remember: true }, device.state),
        db.addItems('accounts', accounts),
        db.addItems('discovery', serializableDiscovery),
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
    ]);
};

export const saveWalletSettings = () => (_dispatch: Dispatch, getState: GetState) => {
    db.addItem(
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
    SuiteDB.isDBAvailable(async (isAvailable: boolean) => {
        let suite: Partial<AppState['suite']> | typeof undefined;
        let devices: AppState['devices'] = [];
        let walletSettings: AppState['wallet']['settings'] | typeof undefined;
        let accounts: AppState['wallet']['accounts'] = [];
        let discovery: AppState['wallet']['discovery'] = [];
        let txs: any; // TODO: load transactions from db
        if (!isAvailable) {
            // TODO: Display error for the user (eg. redirect to unsupported browser page)
            console.warn('IndexedDB not supported');
        } else {
            //  load state from database
            suite = await db.getItemByPK('suiteSettings', 'suite');
            devices = await db.getItemsExtended('devices');
            accounts = await db.getItemsExtended('accounts');
            discovery = await db.getItemsExtended('discovery');
            walletSettings = await db.getItemByPK('walletSettings', 'wallet');
            console.log('accounts', accounts);
            // txs = await db.getItemsExtended('txs', 'accountId-blockTime', {
            //     key: accountIndex,
            // });
        }

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
                    transactions: txs || [],
                },
            },
        });
    });
};

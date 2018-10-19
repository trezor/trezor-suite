/* @flow */


import * as CONNECT from 'actions/constants/TrezorConnect';
import * as ACCOUNT from 'actions/constants/account';
import * as TOKEN from 'actions/constants/token';
import * as DISCOVERY from 'actions/constants/discovery';
import * as STORAGE from 'actions/constants/localStorage';
import * as PENDING from 'actions/constants/pendingTx';
import * as WALLET from 'actions/constants/wallet';
import { httpRequest } from 'utils/networkUtils';
import * as buildUtils from 'utils/build';

import { findAccountTokens } from 'reducers/TokensReducer';
import type { Account } from 'reducers/AccountsReducer';
import type { Token } from 'reducers/TokensReducer';
import type { PendingTx } from 'reducers/PendingTxReducer';
import type { Discovery } from 'reducers/DiscoveryReducer';


import type {
    TrezorDevice,
    ThunkAction,
    AsyncAction,
    GetState,
    Dispatch,
} from 'flowtype';
import type { Config, Network, TokensCollection } from 'reducers/LocalStorageReducer';

import Erc20AbiJSON from 'public/data/ERC20Abi.json';
import AppConfigJSON from 'public/data/appConfig.json';

export type StorageAction = {
    type: typeof STORAGE.READY,
    config: Config,
    tokens: TokensCollection,
    ERC20Abi: Array<TokensCollection>
} | {
    type: typeof STORAGE.SAVE,
    network: string,
} | {
    type: typeof STORAGE.ERROR,
    error: string,
};

const get = (key: string): ?string => {
    try {
        return window.localStorage.getItem(key);
    } catch (error) {
        // available = false;
        return null;
    }
};

const set = (key: string, value: string | boolean): void => {
    try {
        window.localStorage.setItem(key, value);
    } catch (error) {
        console.error(`Local Storage ERROR: ${error}`);
    }
};

// https://github.com/STRML/react-localstorage/blob/master/react-localstorage.js
// or
// https://www.npmjs.com/package/redux-react-session

const findAccounts = (devices: Array<TrezorDevice>, accounts: Array<Account>): Array<Account> => devices.reduce((arr, dev) => arr.concat(accounts.filter(a => a.deviceState === dev.state)), []);

const findTokens = (accounts: Array<Account>, tokens: Array<Token>): Array<Token> => accounts.reduce((arr, account) => arr.concat(findAccountTokens(tokens, account)), []);

const findDiscovery = (devices: Array<TrezorDevice>, discovery: Array<Discovery>): Array<Discovery> => devices.reduce((arr, dev) => arr.concat(discovery.filter(a => a.deviceState === dev.state && a.publicKey.length > 0)), []);

const findPendingTxs = (accounts: Array<Account>, pending: Array<PendingTx>): Array<PendingTx> => accounts.reduce((result, account) => result.concat(pending.filter(p => p.address === account.address && p.network === account.network)), []);

export const save = (): ThunkAction => (dispatch: Dispatch, getState: GetState): void => {
    const devices: Array<TrezorDevice> = getState().devices.filter(d => d.features && d.remember === true);
    const accounts: Array<Account> = findAccounts(devices, getState().accounts);
    const tokens: Array<Token> = findTokens(accounts, getState().tokens);
    const pending: Array<PendingTx> = findPendingTxs(accounts, getState().pending);
    const discovery: Array<Discovery> = findDiscovery(devices, getState().discovery);

    // save devices
    set('devices', JSON.stringify(devices));

    // save already preloaded accounts
    set('accounts', JSON.stringify(accounts));

    // save discovery state
    set('discovery', JSON.stringify(discovery));

    // tokens
    set('tokens', JSON.stringify(tokens));

    // pending transactions
    set('pending', JSON.stringify(pending));
};

export const update = (event: StorageEvent): ThunkAction => (dispatch: Dispatch): void => {
    if (!event.newValue) return;

    if (event.key === 'devices') {
        // check if device was added/ removed
        // const newDevices: Array<TrezorDevice> = JSON.parse(event.newValue);
        // const myDevices: Array<TrezorDevice> = getState().connect.devices.filter(d => d.features);

        // if (newDevices.length !== myDevices.length) {
        //     const diff = myDevices.filter(d => newDevices.indexOf(d) < 0)
        //     console.warn("DEV LIST CHANGED!", newDevices.length, myDevices.length, diff)
        //     // check if difference is caused by local device which is not saved
        //     // or device which was saved in other tab
        // }

        // const diff = oldDevices.filter(d => newDevices.indexOf())
    }

    if (event.key === 'accounts') {
        dispatch({
            type: ACCOUNT.FROM_STORAGE,
            payload: JSON.parse(event.newValue),
        });
    }

    if (event.key === 'tokens') {
        dispatch({
            type: TOKEN.FROM_STORAGE,
            payload: JSON.parse(event.newValue),
        });
    }

    if (event.key === 'pending') {
        dispatch({
            type: PENDING.FROM_STORAGE,
            payload: JSON.parse(event.newValue),
        });
    }

    if (event.key === 'discovery') {
        dispatch({
            type: DISCOVERY.FROM_STORAGE,
            payload: JSON.parse(event.newValue),
        });
    }
};

const VERSION: string = '1';

const loadJSON = (): AsyncAction => async (dispatch: Dispatch): Promise<void> => {
    if (typeof window.localStorage === 'undefined') return;

    try {
        const config: Config = await httpRequest(AppConfigJSON, 'json');

        if (!buildUtils.isDev()) {
            const index = config.networks.findIndex(c => c.shortcut === 'trop');
            delete config.networks[index];
        }

        const ERC20Abi = await httpRequest(Erc20AbiJSON, 'json');

        window.addEventListener('storage', (event) => {
            dispatch(update(event));
        });

        // validate version
        const version: ?string = get('version');
        if (version !== VERSION) {
            try {
                window.localStorage.clear();
                window.sessionStorage.clear();
            } catch (error) {
                // empty
            }
            set('version', VERSION);
        }

        // load tokens
        const tokens = await config.networks.reduce(async (promise: Promise<TokensCollection>, network: Network): Promise<TokensCollection> => {
            const collection: TokensCollection = await promise;
            const json = await httpRequest(network.tokens, 'json');
            collection[network.shortcut] = json;
            return collection;
        }, Promise.resolve({}));

        dispatch({
            type: STORAGE.READY,
            config,
            tokens,
            ERC20Abi,
        });
    } catch (error) {
        dispatch({
            type: STORAGE.ERROR,
            error,
        });
    }
};


const loadStorageData = (): ThunkAction => (dispatch: Dispatch): void => {
    const devices: ?string = get('devices');
    if (devices) {
        dispatch({
            type: CONNECT.DEVICE_FROM_STORAGE,
            payload: JSON.parse(devices),
        });
    }

    const accounts: ?string = get('accounts');
    if (accounts) {
        dispatch({
            type: ACCOUNT.FROM_STORAGE,
            payload: JSON.parse(accounts),
        });
    }

    const userTokens: ?string = get('tokens');
    if (userTokens) {
        dispatch({
            type: TOKEN.FROM_STORAGE,
            payload: JSON.parse(userTokens),
        });
    }

    const pending: ?string = get('pending');
    if (pending) {
        dispatch({
            type: PENDING.FROM_STORAGE,
            payload: JSON.parse(pending),
        });
    }

    const discovery: ?string = get('discovery');
    if (discovery) {
        dispatch({
            type: DISCOVERY.FROM_STORAGE,
            payload: JSON.parse(discovery),
        });
    }

    if (buildUtils.isDev() || buildUtils.isBeta()) {
        const betaModal = get('/betaModalPrivacy');
        if (!betaModal) {
            dispatch({
                type: WALLET.SHOW_BETA_DISCLAIMER,
                show: true,
            });
        }
    }
};

export const loadData = (): ThunkAction => (dispatch: Dispatch, getState: GetState): void => {
    dispatch(loadStorageData());

    // stop loading resources and wait for user action
    if (!getState().wallet.showBetaDisclaimer) {
        dispatch(loadJSON());
    }
};

export const hideBetaDisclaimer = (): ThunkAction => (dispatch: Dispatch): void => {
    set('/betaModalPrivacy', true);
    dispatch(loadJSON());
};

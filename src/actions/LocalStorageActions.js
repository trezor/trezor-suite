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
import * as storageUtils from 'utils/storage';

import { getAccountTokens } from 'reducers/utils';
import type { Account } from 'reducers/AccountsReducer';
import type { Token } from 'reducers/TokensReducer';
import type { Discovery } from 'reducers/DiscoveryReducer';

import type {
    TrezorDevice,
    ThunkAction,
    AsyncAction,
    GetState,
    Dispatch,
    Transaction,
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

const TYPE: 'local' = 'local';
const { STORAGE_PATH } = storageUtils;
const KEY_VERSION: string = `${STORAGE_PATH}version`;
const KEY_DEVICES: string = `${STORAGE_PATH}devices`;
const KEY_ACCOUNTS: string = `${STORAGE_PATH}accounts`;
const KEY_DISCOVERY: string = `${STORAGE_PATH}discovery`;
const KEY_TOKENS: string = `${STORAGE_PATH}tokens`;
const KEY_PENDING: string = `${STORAGE_PATH}pending`;
const KEY_BETA_MODAL: string = '/betaModalPrivacy'; // this key needs to be compatible with "parent" (old) wallet

// https://github.com/STRML/react-localstorage/blob/master/react-localstorage.js
// or
// https://www.npmjs.com/package/redux-react-session

const findAccounts = (devices: Array<TrezorDevice>, accounts: Array<Account>): Array<Account> => devices.reduce((arr, dev) => arr.concat(accounts.filter(a => a.deviceState === dev.state)), []);

const findTokens = (accounts: Array<Account>, tokens: Array<Token>): Array<Token> => accounts.reduce((arr, account) => arr.concat(getAccountTokens(tokens, account)), []);

const findDiscovery = (devices: Array<TrezorDevice>, discovery: Array<Discovery>): Array<Discovery> => devices.reduce((arr, dev) => arr.concat(discovery.filter(d => d.deviceState === dev.state && d.completed)), []);

const findPendingTxs = (accounts: Array<Account>, pending: Array<Transaction>): Array<Transaction> => accounts.reduce((result, account) => result.concat(pending.filter(p => p.descriptor === account.descriptor && p.network === account.network)), []);

export const save = (): ThunkAction => (dispatch: Dispatch, getState: GetState): void => {
    const devices: Array<TrezorDevice> = getState().devices.filter(d => d.features && d.remember === true);
    const accounts: Array<Account> = findAccounts(devices, getState().accounts);
    const tokens: Array<Token> = findTokens(accounts, getState().tokens);
    const pending: Array<Transaction> = findPendingTxs(accounts, getState().pending);
    const discovery: Array<Discovery> = findDiscovery(devices, getState().discovery);

    // save devices
    storageUtils.set(TYPE, KEY_DEVICES, JSON.stringify(devices));

    // save already preloaded accounts
    storageUtils.set(TYPE, KEY_ACCOUNTS, JSON.stringify(accounts));

    // save discovery state
    storageUtils.set(TYPE, KEY_DISCOVERY, JSON.stringify(discovery));

    // tokens
    storageUtils.set(TYPE, KEY_TOKENS, JSON.stringify(tokens));

    // pending transactions
    storageUtils.set(TYPE, KEY_PENDING, JSON.stringify(pending));
};

export const update = (event: StorageEvent): ThunkAction => (dispatch: Dispatch): void => {
    if (!event.newValue) return;

    if (event.key === KEY_DEVICES) {
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

    if (event.key === KEY_ACCOUNTS) {
        dispatch({
            type: ACCOUNT.FROM_STORAGE,
            payload: JSON.parse(event.newValue),
        });
    }

    if (event.key === KEY_TOKENS) {
        dispatch({
            type: TOKEN.FROM_STORAGE,
            payload: JSON.parse(event.newValue),
        });
    }

    if (event.key === KEY_PENDING) {
        dispatch({
            type: PENDING.FROM_STORAGE,
            payload: JSON.parse(event.newValue),
        });
    }

    if (event.key === KEY_DISCOVERY) {
        dispatch({
            type: DISCOVERY.FROM_STORAGE,
            payload: JSON.parse(event.newValue),
        });
    }
};

const loadJSON = (): AsyncAction => async (dispatch: Dispatch): Promise<void> => {
    if (typeof window.localStorage === 'undefined') return;

    try {
        const config: Config = await httpRequest(AppConfigJSON, 'json');

        // remove testnets from config networks
        if (!buildUtils.isDev()) {
            config.networks = config.networks.filter(n => !n.testnet);
        }

        const ERC20Abi = await httpRequest(Erc20AbiJSON, 'json');

        window.addEventListener('storage', (event) => {
            dispatch(update(event));
        });

        // load tokens
        const tokens = await config.networks.reduce(async (promise: Promise<TokensCollection>, network: Network): Promise<TokensCollection> => {
            const collection: TokensCollection = await promise;
            if (network.tokens) {
                const json = await httpRequest(network.tokens, 'json');
                collection[network.shortcut] = json;
            }
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

const VERSION: string = '2';

const loadStorageData = (): ThunkAction => (dispatch: Dispatch): void => {
    // validate version
    const version: ?string = storageUtils.get(TYPE, KEY_VERSION);
    if (version && version !== VERSION) {
        storageUtils.clearAll();
    }
    storageUtils.set(TYPE, KEY_VERSION, VERSION);

    const devices: ?string = storageUtils.get(TYPE, KEY_DEVICES);
    if (devices) {
        dispatch({
            type: CONNECT.DEVICE_FROM_STORAGE,
            payload: JSON.parse(devices),
        });
    }

    const accounts: ?string = storageUtils.get(TYPE, KEY_ACCOUNTS);
    if (accounts) {
        dispatch({
            type: ACCOUNT.FROM_STORAGE,
            payload: JSON.parse(accounts),
        });
    }

    const userTokens: ?string = storageUtils.get(TYPE, KEY_TOKENS);
    if (userTokens) {
        dispatch({
            type: TOKEN.FROM_STORAGE,
            payload: JSON.parse(userTokens),
        });
    }

    const pending: ?string = storageUtils.get(TYPE, KEY_PENDING);
    if (pending) {
        dispatch({
            type: PENDING.FROM_STORAGE,
            payload: JSON.parse(pending),
        });
    }

    const discovery: ?string = storageUtils.get(TYPE, KEY_DISCOVERY);
    if (discovery) {
        dispatch({
            type: DISCOVERY.FROM_STORAGE,
            payload: JSON.parse(discovery),
        });
    }

    if (buildUtils.isDev() || buildUtils.isBeta()) {
        const betaModal = Object.keys(window.localStorage).find(key => key.indexOf(KEY_BETA_MODAL) >= 0);
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
    storageUtils.set(TYPE, KEY_BETA_MODAL, true);
    dispatch(loadJSON());
};

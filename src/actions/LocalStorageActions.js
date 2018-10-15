/* @flow */


import * as CONNECT from 'actions/constants/TrezorConnect';
import * as ACCOUNT from 'actions/constants/account';
import * as TOKEN from 'actions/constants/token';
import * as DISCOVERY from 'actions/constants/discovery';
import * as STORAGE from 'actions/constants/localStorage';
import * as PENDING from 'actions/constants/pendingTx';
import { httpRequest } from 'utils/networkUtils';
import * as buildUtils from 'utils/build';

import type {
    ThunkAction, AsyncAction, /* GetState, */ Dispatch,
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

export const get = (key: string): ?string => {
    try {
        return window.localStorage.getItem(key);
    } catch (error) {
        // available = false;
        return null;
    }
};

export function update(event: StorageEvent): AsyncAction {
    return async (dispatch: Dispatch/* , getState: GetState */): Promise<void> => {
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
}

const VERSION: string = '1';

export function loadTokensFromJSON(): AsyncAction {
    return async (dispatch: Dispatch): Promise<void> => {
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
                window.localStorage.clear();
                dispatch(save('version', VERSION));
            }

            // load tokens
            const tokens = await config.networks.reduce(async (promise: Promise<TokensCollection>, network: Network): Promise<TokensCollection> => {
                const collection: TokensCollection = await promise;
                const json = await httpRequest(network.tokens, 'json');
                collection[network.shortcut] = json;
                return collection;
            }, Promise.resolve({}));

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
}

export const loadData = (): ThunkAction => (dispatch: Dispatch): void => {
    // check if local storage is available
    // let available: boolean = true;
    // if (typeof window.localStorage === 'undefined') {
    //     available = false;
    // } else {
    //     try {
    //         window.localStorage.setItem('ethereum_wallet', true);
    //     } catch (error) {
    //         available = false;
    //     }
    // }

    dispatch(loadTokensFromJSON());
};

export const save = (key: string, value: string): ThunkAction => (): void => {
    if (typeof window.localStorage !== 'undefined') {
        try {
            window.localStorage.setItem(key, value);
        } catch (error) {
            // available = false;
            console.error(`Local Storage ERROR: ${error}`);
        }
    }
};
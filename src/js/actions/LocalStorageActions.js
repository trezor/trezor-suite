/* @flow */
'use strict';

import * as CONNECT from './constants/TrezorConnect';
import * as ACCOUNT from './constants/account';
import * as TOKEN from './constants/token';
import * as DISCOVERY from './constants/discovery';
import * as STORAGE from './constants/localStorage';
import * as PENDING from '../actions/constants/pendingTx';
import { JSONRequest, httpRequest } from '../utils/networkUtils';

import type { ThunkAction, AsyncAction, GetState, Dispatch } from '../flowtype';
import type { Config, Coin, TokensCollection } from '../reducers/LocalStorageReducer';

export type StorageAction = {
    type: typeof STORAGE.READY,
    config: Config,
    tokens: TokensCollection,
    ERC20Abi: Array<Object>
} | {
    type: typeof STORAGE.SAVE,
    network: string,
} | {
    type: typeof STORAGE.ERROR,
    error: string,
};

export const loadData = (): ThunkAction => {
    return (dispatch: Dispatch, getState: GetState): void => {

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

        dispatch( loadTokensFromJSON() );
    }
}

// const parseConfig = (json: JSON): Config => {

//     if (json['coins']) {

//     }

//     for (let key in json) {
//         if (key === 'coins') {

//         }
//     }

//     const coins: Array<Object> = json.coins || [];

//     if ("coins" in json){
//         json.coins
//     }
//     if (!json.hasOwnProperty("fiatValueTickers")) throw new Error(`Property "fiatValueTickers" is missing in appConfig.json`);
//     if (json.config && json.hasOwnProperty('coins') && Array.isArray(json.coins)) {
//         json.coins.map(c => {
//             return {
    
//             }
//         })
//     } else {
//         throw new Error(`Property "coins" is missing in appConfig.json`);
//     }
    

//     return {
//         coins: [],
//         fiatValueTickers: []
//     }
// }

export function loadTokensFromJSON(): AsyncAction {
    return async (dispatch: Dispatch, getState: GetState): Promise<void> => {
        try {
            const config: Config = await httpRequest('data/appConfig.json', 'json');
            const ERC20Abi = await httpRequest('data/ERC20Abi.json', 'json');

            // load tokens
            const tokens = await config.coins.reduce(async (promise: Promise<TokensCollection>, coin: Coin): Promise<TokensCollection> => {
                const collection: TokensCollection = await promise;
                const json = await httpRequest(coin.tokens, 'json');
                collection[ coin.network ] = json;
                return collection;
            }, Promise.resolve({}));

            const devices: ?string = get('devices');
            if (devices) {
                dispatch({
                    type: CONNECT.DEVICE_FROM_STORAGE,
                    payload: JSON.parse(devices)
                })
            }

            const accounts: ?string = get('accounts');
            if (accounts) {
                dispatch({
                    type: ACCOUNT.FROM_STORAGE,
                    payload: JSON.parse(accounts)
                })
            }

            const userTokens: ?string = get('tokens');
            if (userTokens) {
                dispatch({
                    type: TOKEN.FROM_STORAGE,
                    payload: JSON.parse(userTokens)
                })
            }

            const pending: ?string = get('pending');
            if (pending) {
                dispatch({
                    type: PENDING.FROM_STORAGE,
                    payload: JSON.parse(pending)
                })
            }

            const discovery: ?string = get('discovery');
            if (discovery) {
                dispatch({
                    type: DISCOVERY.FROM_STORAGE,
                    payload: JSON.parse(discovery)
                })
            }
            
            
            dispatch({
                type: STORAGE.READY,
                config,
                tokens,
                ERC20Abi
            })

        } catch(error) {
            dispatch({
                type: STORAGE.ERROR,
                error
            })
        }
    }
}


export const save = (key: string, value: string): ThunkAction => {
    return (dispatch: Dispatch, getState: GetState): void => {
        if (typeof window.localStorage !== 'undefined') {
            try {
                window.localStorage.setItem(key, value);
            } catch (error) {
                // available = false;
                console.error("Local Storage ERROR: " + error)
            }
        }
    }
}

export const get = (key: string): ?string => {
    if (typeof window.localStorage !== 'undefined') {
        try {
            return window.localStorage.getItem(key);
        } catch (error) {
            // available = false;
            return null;
        }
    }
}
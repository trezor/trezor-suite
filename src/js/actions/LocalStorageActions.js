/* @flow */
'use strict';

import * as CONNECT from './constants/TrezorConnect';
import * as ADDRESS from './constants/address';
import * as TOKEN from './constants/token';
import * as DISCOVERY from './constants/discovery';
import * as STORAGE from './constants/localStorage';
import { httpRequest } from '../utils/networkUtils';

export function loadData(): any {
    return async (dispatch, getState) => {

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

export function loadTokensFromJSON(): any {
    return async (dispatch, getState) => {
        try {
            const config = await httpRequest('data/appConfig.json', 'json');
            const ERC20Abi = await httpRequest('data/ERC20Abi.json', 'json');

            // load tokens
            const tokens = await config.coins.reduce(async (promise: Promise<any>, coin: any): Promise<any> => {
                const collection = await promise;
                const json: JSON = await httpRequest(coin.tokens, 'json');
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
                    type: ADDRESS.FROM_STORAGE,
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
                    type: 'PENDING.FROM_STORAGE',
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


export const save = (key: string, value: string): any => {
    return (dispatch, getState) => {
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
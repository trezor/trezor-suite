/* @flow */
'use strict';

import * as CONNECT from './constants/TrezorConnect';
import * as ADDRESS from './constants/Address';
import * as TOKEN from './constants/Token';
import * as DISCOVERY from './constants/Discovery';
import * as STORAGE from './constants/LocalStorage';
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
            const appConfig = await httpRequest('data/appConfig.json', 'json');
            const ethTokens = await httpRequest('data/ethTokens.json', 'json');
            const ethERC20 = await httpRequest('data/ethERC20.json', 'json');

            const devices: ?string = get('devices');
            console.log("GET23", JSON.parse(devices))
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

            const tokens: ?string = get('tokens');
            if (tokens) {
                dispatch({
                    type: TOKEN.FROM_STORAGE,
                    payload: JSON.parse(tokens)
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
                appConfig,
                ethTokens,
                ethERC20
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
            //console.log("SAVEE!!!!", key, value)
            try {
                window.localStorage.setItem(key, value);
            } catch (error) {
                // available = false;
                console.error("ERROR: " + error)
            }
        }
    }
}

export const get = (key: string): ?string => {
    if (typeof window.localStorage !== 'undefined') {
        try {
            console.log("GETTT", JSON.parse(window.localStorage.getItem(key)))
            return window.localStorage.getItem(key);
        } catch (error) {
            // available = false;
            return null;
        }
    }
}
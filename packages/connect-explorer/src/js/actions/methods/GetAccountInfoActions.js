/* @flow */
'use strict';

import TrezorConnect from 'trezor-connect';
import { onResponse } from './CommonActions';

const PREFIX: string = 'accountinfo';
export const COIN_CHANGE: string = `${PREFIX}_coin_@change`;
export const PATH_CHANGE: string = `${PREFIX}_path_@change`;

export function onCoinChange(coin: string): any {
    return {
        type: COIN_CHANGE,
        coin
    }
}

export function onPathChange(path: string): any {
    return {
        type: PATH_CHANGE,
        path
    }
}

export function onGetAccountInfo(): any {
    return async function (dispatch, getState) {
        const response = await TrezorConnect.getAccountInfo( getState().common.params );
        // const response = await TrezorConnect.getAccountInfo({
        //     path: getState().common.params.path,
        //     coin: getState().common.params.coin,
        //     crossChain: false
        // });
        dispatch( onResponse(response) );
    }
}
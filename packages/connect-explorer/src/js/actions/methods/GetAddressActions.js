/* @flow */
'use strict';

import TrezorConnect from 'trezor-connect';
import { onResponse } from './CommonActions';

const PREFIX: string = 'getaddress';
export const COIN_CHANGE: string = `${PREFIX}_coin_@change`;
export const PATH_CHANGE: string = `${PREFIX}_path_@change`;
export const CONFIRMATION_CHANGE: string = `${PREFIX}_confirmation_@change`;

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

export function onConfirmationChange(showOnTrezor: boolean): any {
    return {
        type: CONFIRMATION_CHANGE,
        showOnTrezor
    }
}

export function onGetAddress(): any {
    return async function (dispatch, getState) {
        const response = await TrezorConnect.getAddress(getState().common.params);
        dispatch( onResponse(response) );
    }
}


/* @flow */
'use strict';

import TrezorConnect from 'trezor-connect';
import { onResponse } from './CommonActions';

const PREFIX: string = 'eth_getxpub';
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

export function onGetXpub(): any {
    return async function (dispatch, getState) {

        const params = getState().common.params;
        const bundled = params.path.split(';');
        let response;
        if (bundled.length > 1) {
            const bundle = bundled.map(b => {
                return { path: b }
            });
            response = await TrezorConnect.ethereumGetPublicKey( { bundle } );
        } else {
            response = await TrezorConnect.ethereumGetPublicKey( params );
        }

        dispatch( onResponse(response) );
    }
}
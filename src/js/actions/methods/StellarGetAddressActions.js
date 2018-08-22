/* @flow */
'use strict';

import TrezorConnect from 'trezor-connect';
import { onResponse } from './CommonActions';

const PREFIX: string = 'stellar_getaddress';
export const NETWORK_CHANGE: string = `${PREFIX}_network_@change`;
export const PATH_CHANGE: string = `${PREFIX}_path_@change`;
export const CONFIRMATION_CHANGE: string = `${PREFIX}_confirmation_@change`;

export function onConfirmationChange(showOnTrezor: boolean): any {
    return {
        type: CONFIRMATION_CHANGE,
        showOnTrezor
    }
}

export function onPathChange(path: string): any {
    return {
        type: PATH_CHANGE,
        path
    }
}

export function onGetAddress(tx: string): any {
    return async function (dispatch, getState) {
        const params = getState().common.params;
        const bundled = params.path.split(';');
        let response;
        if (bundled.length > 1) {
            const bundle = bundled.map(b => {
                return { path: b, showOnTrezor: params.showOnTrezor }
            });
            response = await TrezorConnect.stellarGetAddress( { bundle } );
        } else {
            response = await TrezorConnect.stellarGetAddress( params );
        }

        dispatch( onResponse(response) );
    }
}
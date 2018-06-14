/* @flow */
'use strict';

import TrezorConnect from 'trezor-connect';
import { onResponse } from './CommonActions';

const PREFIX: string = 'nem_getaddress';
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

export function onNetworkChange(network: string): any {
    return {
        type: NETWORK_CHANGE,
        network
    }
}

export function onGetAddress(tx: string): any {
    return async function (dispatch, getState) {
        const response = await TrezorConnect.nemGetAddress( getState().common.params );
        dispatch( onResponse(response) );
    }
}
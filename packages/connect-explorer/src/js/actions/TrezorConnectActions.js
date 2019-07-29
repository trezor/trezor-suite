/* @flow */
'use strict';

import TrezorConnect, { UI } from 'trezor-connect';
import * as ACTIONS from './index';

export function onSelectDevice(path: string): any {
    return {
        type: ACTIONS.ON_SELECT_DEVICE,
        path
    }
}


//export function getPublicKey(): any {
export function onSelectDevice2(): any {
    return async function (dispatch) {
        let resp = await TrezorConnect.getPublicKey({ account: 0, confirmation: true, coin: 'btc' });
        dispatch({
            type: 'DDD'
        });
    }
}
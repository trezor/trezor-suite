/* @flow */
'use strict';

import TrezorConnect, { UI } from 'trezor-connect';
import * as ACTIONS from './index';

export function onSelectDevice2(path: string): any {
    return {
        type: 'select_device',
        path
    }
}


//export function getPublicKey(): any {
export function onSelectDevice(): any {
    return async function (dispatch) {
        let resp = await TrezorConnect.getPublicKey({ account: 0, confirmation: true, coin: 'btc' });
        dispatch({
            type: 'DDD'
        });
    }
}
/* @flow */
'use strict';

import TrezorConnect from 'trezor-connect';
import { onResponse } from './CommonActions';


export function onWipeDevice(): any {
    return async function (dispatch, getState) {

        const response = await TrezorConnect.wipeDevice();

        dispatch( onResponse(response) );
    }
}


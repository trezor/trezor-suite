/* @flow */
'use strict';

import TrezorConnect from 'trezor-connect';
import { onResponse } from './CommonActions';

import TXS from './nem.tests';

const PREFIX: string = 'custom_';
export const FN_CHANGE: string = `${PREFIX}_json_@change`;

export function onFnChange(customFunction: string): any {
    return {
        type: FN_CHANGE,
        customFunction
    }
}

export function onCustomMessage(tx: string): any {
    return async function (dispatch, getState) {

        const response = await TrezorConnect.customMessage({
            customFunction: getState().custom.customFunction
        });

        dispatch( onResponse(response) );
    }
}
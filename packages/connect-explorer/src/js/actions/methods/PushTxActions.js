/* @flow */
'use strict';

import TrezorConnect from 'trezor-connect';
import { onResponse } from './CommonActions';

const PREFIX: string = 'pushtx';
export const COIN_CHANGE: string = `${PREFIX}_coin_@change`;
export const TX_CHANGE: string = `${PREFIX}_tx_@change`;

export function onCoinChange(coin: string): any {
    return {
        type: COIN_CHANGE,
        coin
    }
}

export function onTxChange(tx: string): any {
    return {
        type: TX_CHANGE,
        tx
    }
}

export function onPushTx(): any {
    return async function (dispatch, getState) {
        const response = await TrezorConnect.pushTransaction( getState().common.params );
        dispatch( onResponse(response) );
    }
}
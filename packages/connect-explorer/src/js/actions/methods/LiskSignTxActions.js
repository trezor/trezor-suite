/* @flow */
'use strict';

import TrezorConnect from 'trezor-connect';
import { onResponse } from './CommonActions';

const PREFIX: string = 'lisk_signtx';
export const PATH_CHANGE: string = `${PREFIX}_path_@change`;
export const TX_CHANGE: string = `${PREFIX}_tx_@change`;



export function onPathChange(path: string): any {
    return {
        type: PATH_CHANGE,
        path
    }
}

export function onTransactionChange(transaction: string): any {
    return {
        type: TX_CHANGE,
        transaction
    }
}

export function onSignTx(): any {
    return async function (dispatch, getState) {
        const { path, transaction } = getState().lisksigntx;
        const tx = eval(`[${transaction}]`);
        const response = await TrezorConnect.liskSignTransaction({
            path: path, 
            transaction: tx[0]
        });

        dispatch( onResponse(response) );
    }
}
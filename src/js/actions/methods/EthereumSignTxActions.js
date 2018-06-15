/* @flow */
'use strict';

import TrezorConnect from 'trezor-connect';
import { onResponse } from './CommonActions';

const PREFIX: string = 'eth_signtx';
export const PATH_CHANGE: string = `${PREFIX}_path_@change`;
export const TX_CHANGE: string = `${PREFIX}_tx_@change`;

export function onTransactionChange(transaction: string): any {
    return {
        type: TX_CHANGE,
        transaction
    }
}

export function onPathChange(path: string): any {
    return {
        type: PATH_CHANGE,
        path
    }
}

export function onSignTx(): any {
    return async function (dispatch, getState) {

        let tx: JSON;
        try {
            const { path, transaction } = getState().ethsigntx;
            tx = JSON.parse( transaction )

            const response = await TrezorConnect.ethereumSignTransaction({
                path: path,
                transaction: tx
            });

            dispatch( onResponse(response) );

        } catch(error) {
            console.warn(error);

            dispatch( onResponse({
                error: 'Invalid JSON'
            }) );
        }
    }
}
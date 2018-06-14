/* @flow */
'use strict';

import TrezorConnect from 'trezor-connect';
import { onResponse } from './CommonActions';

import TXS from './nem.tests';

const PREFIX: string = 'action_nem_signtx_';
export const PATH_CHANGE: string = `${PREFIX}_path_@change`;
export const TX_CHANGE: string = `${PREFIX}_json_@change`;

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

export function onSignTxA(tx: string): any {
    return async function (dispatch, getState) {

        const response = await TrezorConnect.customMessage({
            customFunction: getState().nemsigntx.transaction
        });

        dispatch( onResponse(response) );
    }
}


export function onSignTx(tx: string): any {
    return async function (dispatch, getState) {

        let tx: JSON;
        try {
            const { path, transaction } = getState().nemsigntx;
            tx = JSON.parse( transaction )

            const response = await TrezorConnect.nemSignTransaction({
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

export function onSignTxTests(tx: string): any {
    return async function (dispatch, getState) {

        const response = await TrezorConnect.nemSignTransaction({
            path: "m/44'/1'/0'/0'/0'",
            transaction: TXS[tx]
        });

        dispatch( onResponse(response) );
    }
}
/* @flow */
'use strict';

import TrezorConnect from 'trezor-connect';
import { onResponse } from './CommonActions';

const PREFIX: string = 'stellar_signtx';
export const PATH_CHANGE: string = `${PREFIX}_path_@change`;
export const NETWORK_CHANGE: string = `${PREFIX}_network_@change`;
export const PASSPHRASE_CHANGE: string = `${PREFIX}_passphrase_@change`;
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

export function onNetworkChange(network: string): any {
    return {
        type: NETWORK_CHANGE,
        network
    }
}

export function onPassphraseChange(passphrase: string): any {
    return {
        type: PASSPHRASE_CHANGE,
        passphrase
    }
}

export function onSignTx(): any {
    return async function (dispatch, getState) {
        const { path, ledgerVersion, networkPassphrase, transaction } = getState().stellarsigntx;

        const tx = eval(`[${transaction}]`);
        const response = await TrezorConnect.stellarSignTransaction({
            path: path,
            ledgerVersion,
            networkPassphrase,
            transaction: tx[0]
        });

        dispatch( onResponse(response) );
    }
}
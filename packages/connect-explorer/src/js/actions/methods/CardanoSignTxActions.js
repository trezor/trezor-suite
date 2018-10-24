/* @flow */
'use strict';

import TrezorConnect from 'trezor-connect';
import { onResponse } from './CommonActions';

const PREFIX: string = 'cardano_signtx';
export const NETWORK_CHANGE: string = `${PREFIX}_network_@change`;
export const INPUTS_CHANGE: string = `${PREFIX}_inputs_@change`;
export const OUTPUTS_CHANGE: string = `${PREFIX}_outputs_@change`;
export const TXS_CHANGE: string = `${PREFIX}_txs_@change`;


export function onNetworkChange(network: string): any {
    return {
        type: NETWORK_CHANGE,
        network,
    }
}

export function onInputsChange(inputs: string): any {
    return {
        type: INPUTS_CHANGE,
        inputs
    }
}

export function onOutputsChange(outputs: string): any {
    return {
        type: OUTPUTS_CHANGE,
        outputs
    }
}

export function onTransactionsChange(transactions: string): any {
    return {
        type: TXS_CHANGE,
        transactions
    }
}

export function onSignTx(): any {
    return async function (dispatch, getState) {
        const { network, inputs, outputs, transactions } = getState().cardanosigntx;

        const response = await TrezorConnect.cardanoSignTransaction({
            network: parseInt(network),
            inputs: eval(inputs),
            outputs: eval(outputs),
            transactions: eval(transactions),
        });

        dispatch( onResponse(response) );
    }
}
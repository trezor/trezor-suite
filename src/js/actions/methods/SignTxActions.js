/* @flow */
'use strict';

import TrezorConnect from 'trezor-connect';
import { onResponse } from './CommonActions';

import * as test from './signtx.test';

const PREFIX: string = 'signtx';
export const COIN_CHANGE: string = `${PREFIX}_coin_@change`;
export const INPUTS_CHANGE: string = `${PREFIX}_inputs_@change`;
export const OUTPUTS_CHANGE: string = `${PREFIX}_outputs_@change`;
export const PUSH_CHANGE: string = `${PREFIX}_push_@change`;

export function onCoinChange(coin: string): any {
    return {
        type: COIN_CHANGE,
        coin
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

export function onPushChange(push: boolean): any {
    return {
        type: PUSH_CHANGE,
        push
    }
}

export function onSignTransaction(): any {
    return async function (dispatch, getState) {

        const response = await TrezorConnect.signTransaction({
            inputs: eval( getState().signtx.inputs ),
            outputs: eval( getState().signtx.outputs ),
            coin: getState().signtx.coin,
            push: getState().signtx.push
        });

        // const response = await TrezorConnect.signTransaction({
        //     inputs: test.SEGWIT_INPUTS.OPRETURN,
        //     outputs: test.SEGWIT_OUTPUTS.OPRETURN,
        //     coin: 'btc'
        // });
        dispatch( onResponse(response) );
    }
}


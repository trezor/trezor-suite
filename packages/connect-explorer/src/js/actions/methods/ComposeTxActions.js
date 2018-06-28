/* @flow */
'use strict';

import TrezorConnect from 'trezor-connect';
import { onResponse } from './CommonActions';

const PREFIX: string = 'composetx';
export const COIN_CHANGE: string = `${PREFIX}_coin_@change`;
export const OUTPUTS_CHANGE: string = `${PREFIX}_output_@change`;
export const PUSH_CHANGE: string = `${PREFIX}_push_@change`;
export const LOCKTIME_ENABLE: string = `${PREFIX}_locktime_enable_@change`;
export const LOCKTIME_CHANGE: string = `${PREFIX}_locktime_@change`;


export function onCoinChange(coin: string): any {
    return {
        type: COIN_CHANGE,
        coin
    }
}

export function onOutputsChange(outputs: string): any {
    return {
        type: OUTPUTS_CHANGE,
        outputs
    }
}

export function onLocktimeEnable(status: boolean): any {
    return {
        type: LOCKTIME_ENABLE,
        status
    }
}

export function onLocktimeChange(value: number): any {
    return {
        type: LOCKTIME_CHANGE,
        value
    }
}

export function onPushChange(push: boolean): any {
    return {
        type: PUSH_CHANGE,
        push
    }
}

export function onComposeTx(): any {
    return async function (dispatch, getState) {
        const response = await TrezorConnect.composeTransaction({
            outputs: eval( getState().composetx.outputs ),
            coin: getState().composetx.coin,
            locktime: getState().composetx.locktime,
            push: getState().composetx.push
        });
        dispatch( onResponse(response) );
    }
}
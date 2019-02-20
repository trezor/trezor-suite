/* @flow */

import { push } from 'connected-react-router';
import TrezorConnect from 'trezor-connect';
import { onResponse } from './CommonActions';

const PREFIX: string = 'message';
export const COIN_CHANGE: string = `${PREFIX}_coin_@change`;
export const PATH_CHANGE: string = `${PREFIX}_path_@change`;
export const MESSAGE_CHANGE: string = `${PREFIX}_message_@change`;
export const SIGNATURE_CHANGE: string = `${PREFIX}_signature_@change`;
export const VERIFY_RESPONSE_VALUES: string = `${PREFIX}_verify_values`;


export function onCoinChange(coin: string): any {
    return {
        type: COIN_CHANGE,
        coin
    }
}

export function onPathChange(path: string): any {
    return {
        type: PATH_CHANGE,
        path
    }
}

export function onMessageChange(message: string): any {
    return {
        type: MESSAGE_CHANGE,
        message
    }
}

export function onSignatureChange(signature: string): any {
    return {
        type: SIGNATURE_CHANGE,
        signature
    }
}

export function onSignMessage(tx: string): any {
    return async function (dispatch, getState) {
        const response = await TrezorConnect.signMessage( getState().common.params );
        dispatch( onResponse(response) );
    }
}

export function onVerifyMessage(tx: string): any {
    return async function (dispatch, getState) {
        const response = await TrezorConnect.verifyMessage( getState().common.params );
        dispatch( onResponse(response) );
    }
}

export function verifyResponseValues(response: any): any {
    return function (dispatch, getState) {
        dispatch({
            type: VERIFY_RESPONSE_VALUES,
            coin: getState().signmessage.coin,
            address: response.payload.address,
            message: getState().signmessage.message,
            signature: response.payload.signature,
        });

        dispatch( push('verifymessage') );
    }
}
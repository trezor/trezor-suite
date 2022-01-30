/* @flow */
'use strict';
import { push } from 'react-router-redux';
import TrezorConnect from 'trezor-connect';
import { onResponse } from './CommonActions';

const PREFIX: string = 'lisk_signverify';
export const PATH_CHANGE: string = `${PREFIX}_path_@change`;
export const PUBLIC_KEY_CHANGE: string = `${PREFIX}_publicKey_@change`;
export const MESSAGE_CHANGE: string = `${PREFIX}_message_@change`;
export const SIGNATURE_CHANGE: string = `${PREFIX}_signature_@change`;
export const VERIFY_RESPONSE_VALUES: string = `${PREFIX}_verify_values`;


export function onPathChange(path: string): any {
    return {
        type: PATH_CHANGE,
        path
    }
}

export function onPublicKeyChange(path: string): any {
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
        const response = await TrezorConnect.liskSignMessage( getState().common.params );
        dispatch( onResponse(response) );
    }
}

export function onVerifyMessage(tx: string): any {
    return async function (dispatch, getState) {
        const response = await TrezorConnect.liskVerifyMessage( getState().common.params );
        dispatch( onResponse(response) );
    }
}

export function verifyResponseValues(response: any): any {
    return function (dispatch, getState) {
        dispatch({
            type: VERIFY_RESPONSE_VALUES,
            publicKey: response.payload.publicKey,
            message: getState().ethsignmessage.message,
            signature: response.payload.signature,
        });

        dispatch( push('lisk-verifymessage') );
    }
}
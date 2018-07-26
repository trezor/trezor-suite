/* @flow */
'use strict';

import TrezorConnect from 'trezor-connect';
import { onResponse } from './CommonActions';

const PREFIX: string = 'cipherkv';
export const PATH_CHANGE: string = `${PREFIX}_path_@change`;
export const KEY_CHANGE: string = `${PREFIX}_key_@change`;
export const VALUE_CHANGE: string = `${PREFIX}_value_@change`;
export const IV_CHANGE: string = `${PREFIX}_iv_@change`;
export const ENCRYPT_CHANGE: string = `${PREFIX}_encrypt_@change`;
export const ASK_ENCRYPT_CHANGE: string = `${PREFIX}_askOnEncrypt_@change`;
export const ASK_DECRYPT_CHANGE: string = `${PREFIX}_askOnDecrypt_@change`;

export function onPathChange(path: string): any {
    return {
        type: PATH_CHANGE,
        path
    }
}

export function onKeyChange(key: string): any {
    return {
        type: KEY_CHANGE,
        key
    }
}

export function onValueChange(value: string): any {
    return {
        type: VALUE_CHANGE,
        value
    }
}

export function onEncryptChange(value: boolean): any {
    return {
        type: ENCRYPT_CHANGE,
        encrypt: value
    }
}

export function onAskOnEncryptChange(value: boolean): any {
    return {
        type: ASK_ENCRYPT_CHANGE,
        askOnEncrypt: value
    }
}

export function onAskOnDecryptChange(value: boolean): any {
    return {
        type: ASK_DECRYPT_CHANGE,
        askOnDecrypt: value
    }
}

export function onIVChange(iv: string): any {
    return {
        type: IV_CHANGE,
        iv
    }
}

export function onCipherKeyValue(): any {
    return async function (dispatch, getState) {

        const response = await TrezorConnect.cipherKeyValue( { ...getState().common.params, useEmptyPassphrase: true } );

        // const response = await TrezorConnect.cipherKeyValue({
        //     bundle: [
        //         {
        //             path: "m/49'/0'/0'",
        //             key: "My key",
        //             value: "1c0ffeec0ffeec0ffeec0ffeec0ffee1",
        //             encrypt: true,
        //             askOnEncrypt: true
        //         },
        //         {
        //             path: "m/49'/0'/0'",
        //             key: "My key2",
        //             value: "1c0ffeec0ffeec0ffeec0ffeec0ffee1",
        //             encrypt: true,
        //             askOnEncrypt: true
        //         },
        //         {
        //             path: "m/49'/0'/0'",
        //             key: "My key3",
        //             value: "1c0ffeec0ffeec0ffeec0ffeec0ffee1",
        //             encrypt: true,
        //             askOnEncrypt: true
        //         },
        //     ]
        // });

        dispatch( onResponse(response) );
    }
}
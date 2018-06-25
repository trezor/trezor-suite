/* @flow */
'use strict';

import TrezorConnect from 'trezor-connect';
import { onResponse } from './CommonActions';

const PREFIX: string = 'login';
export const IDENTITY_CHANGE: string = `${PREFIX}_identity_@change`;
export const HIDDEN_CHANGE: string = `${PREFIX}_hidden_@change`;
export const VISUAL_CHANGE: string = `${PREFIX}_visual_@change`;
export const CALLBACK_CHANGE: string = `${PREFIX}_callback_@change`;

export function onIdentityChange(identity: string): any {
    return {
        type: IDENTITY_CHANGE,
        identity
    }
}

export function onHiddenChange(hidden: string): any {
    return {
        type: HIDDEN_CHANGE,
        hidden
    }
}

export function onVisualChange(visual: string): any {
    return {
        type: VISUAL_CHANGE,
        visual
    }
}

export function onCallbackChange(callback: string): any {
    return {
        type: CALLBACK_CHANGE,
        callback
    }
}

export function onLogin(): any {
    return async function (dispatch, getState) {

        const params = { ...getState().common.params };

        if (params.callback) {
            const handler = eval('(' + params.callback + ');');
            if (typeof handler !== 'function') {
                dispatch( onResponse({
                    error: 'Invalid handler function'
                }) );
                return;
            }
            params.callback = handler;
        }

        if (params.identity) {
            params.identity = JSON.parse(params.identity)
        }

        const response = await TrezorConnect.requestLogin(params);

        dispatch( onResponse(response) );
    }
}
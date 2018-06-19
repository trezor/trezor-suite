/* @flow */
'use strict';

import TrezorConnect from 'trezor-connect';
import { onResponse } from './CommonActions';

// import messages from '../../data/custom.messages';

const PREFIX: string = 'custom';
export const MESSAGES_CHANGE: string = `${PREFIX}_messages_@change`;
export const MESSAGE_CHANGE: string = `${PREFIX}_message_@change`;
export const PARAMS_CHANGE: string = `${PREFIX}_params_@change`;
export const CALLBACK_CHANGE: string = `${PREFIX}_callback_@change`;


export function onMessagesChange(messages: string): any {
    return {
        type: MESSAGES_CHANGE,
        messages
    }
}

export function onMessageChange(message: string): any {
    return {
        type: MESSAGE_CHANGE,
        message
    }
}

export function onParamsChange(params: string): any {
    return {
        type: PARAMS_CHANGE,
        params
    }
}

export function onCallbackChange(callback: string): any {
    return {
        type: CALLBACK_CHANGE,
        callback
    }
}

export function onCustomMessage(tx: string): any {
    return async function (dispatch, getState) {

        const {
            messages,
            message,
            params,
            callback
        } = getState().custom;

        const handler = eval('(' + callback + ');');
        if (typeof handler !== 'function') {
            dispatch( onResponse({
                error: 'Invalid handler function'
            }) );
            return;
        }

        const response = await TrezorConnect.customMessage({
            messages: JSON.parse(messages),
            message,
            params: JSON.parse(params),
            callback: handler
        });

        dispatch( onResponse(response) );
    }
}
/* @flow */
'use strict';

import TrezorConnect, { UI, UI_EVENT } from 'trezor-connect';
import * as MODAL from './constants/modal';
import * as CONNECT from './constants/TrezorConnect';


export function onPinSubmit(value: string): any {
    TrezorConnect.uiResponse({ type: UI.RECEIVE_PIN, payload: value });
    return {
        type: MODAL.CLOSE
    }
}

export function onPassphraseSubmit(passphrase: string): any {
    return async (dispatch, getState): Promise<void> => {
        const resp = await TrezorConnect.uiResponse({ 
            type: UI.RECEIVE_PASSPHRASE, 
            payload: {
                value: passphrase,
                save: true
            } 
        });

        dispatch({
            type: MODAL.CLOSE
        });
    }
}

export const askForRemember = (device: any) => {
    return {
        type: MODAL.REMEMBER,
        device
    }
}

export const onRememberDevice = (device: any) => {
    return {
        type: CONNECT.REMEMBER,
        device
    }
}

export const onForgetDevice = (device: any) => {
    return {
        type: CONNECT.FORGET,
        device,
    }
}

export const onForgetSingleDevice = (device: any) => {
    return {
        type: CONNECT.FORGET_SINGLE,
        device,
    }
}

export const onCancel = () => {
    return {
        type: MODAL.CLOSE
    }
}

export const onDuplicateDevice = (device: any): any => {
    return (dispatch: any, getState: any): void => {

        dispatch( onCancel() );

        dispatch({
            type: CONNECT.DUPLICATE,
            device
        });
    }
}
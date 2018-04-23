/* @flow */
'use strict';

import TrezorConnect, { UI, UI_EVENT } from 'trezor-connect';
import * as MODAL from './constants/modal';
import * as CONNECT from './constants/TrezorConnect';

import type { AsyncAction, Action, GetState, Dispatch, TrezorDevice } from '../flowtype';

export type ModalAction = {
    type: typeof MODAL.CLOSE
} | {
    type: typeof MODAL.REMEMBER,
    device: any
};

export const onPinSubmit = (value: string): Action => {
    TrezorConnect.uiResponse({ type: UI.RECEIVE_PIN, payload: value });
    return {
        type: MODAL.CLOSE
    }
}

export const onPassphraseSubmit = (passphrase: string): AsyncAction => {
    return async (dispatch: Dispatch, getState: GetState): Promise<void> => {
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

// export const askForRemember = (device: TrezorDevice): Action => {
//     return {
//         type: MODAL.REMEMBER,
//         device
//     }
// }

export const onRememberDevice = (device: TrezorDevice): Action => {
    return {
        type: CONNECT.REMEMBER,
        device
    }
}

export const onForgetDevice = (device: TrezorDevice): Action => {
    return {
        type: CONNECT.FORGET,
        device,
    }
}

export const onForgetSingleDevice = (device: TrezorDevice): Action => {
    return {
        type: CONNECT.FORGET_SINGLE,
        device,
    }
}

export const onCancel = (): Action => {
    return {
        type: MODAL.CLOSE
    }
}

export const onDuplicateDevice = (device: TrezorDevice): AsyncAction => {
    return (dispatch: Dispatch, getState: GetState): void => {

        dispatch( onCancel() );

        dispatch({
            type: CONNECT.DUPLICATE,
            device
        });
    }
}

export default {
    onPinSubmit,
    onPassphraseSubmit,
    // askForRemember,
    onRememberDevice,
    onForgetDevice,
    onForgetSingleDevice,
    onCancel,
    onDuplicateDevice
}
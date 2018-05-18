/* @flow */
'use strict';

import TrezorConnect, { UI, UI_EVENT } from 'trezor-connect';
import * as MODAL from './constants/modal';
import * as CONNECT from './constants/TrezorConnect';

import type { ThunkAction, AsyncAction, Action, GetState, Dispatch, TrezorDevice } from '~/flowtype';
import type { State } from '../reducers/ModalReducer';

export type ModalAction = {
    type: typeof MODAL.CLOSE
} | {
    type: typeof MODAL.REMEMBER,
    device: TrezorDevice
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

export const onDuplicateDevice = (device: TrezorDevice): ThunkAction => {
    return (dispatch: Dispatch, getState: GetState): void => {

        dispatch( onCancel() );

        dispatch({
            type: CONNECT.DUPLICATE,
            device
        });
    }
}

export const onRememberRequest = (prevState: State): ThunkAction => {
    return (dispatch: Dispatch, getState: GetState): void => {
        const state: State = getState().modal;
        // handle case where forget modal is already opened
        // TODO: 2 modals at once (two devices disconnected in the same time)
        if (prevState.opened && prevState.windowType === CONNECT.REMEMBER_REQUEST) {
            // forget current (new)
            if (state.opened) {
                dispatch({
                    type: CONNECT.FORGET,
                    device: state.device
                });
            }
            
            // forget previous (old)
            dispatch({
                type: CONNECT.FORGET,
                device: prevState.device
            });
        }
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
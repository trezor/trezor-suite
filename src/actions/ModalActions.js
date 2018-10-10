/* @flow */

import TrezorConnect, { UI } from 'trezor-connect';
import type { Device } from 'trezor-connect';
import * as MODAL from 'actions/constants/modal';
import * as CONNECT from 'actions/constants/TrezorConnect';

import type {
    ThunkAction, AsyncAction, Action, GetState, Dispatch, TrezorDevice,
} from 'flowtype';
import type { State } from 'reducers/ModalReducer';

export type ModalAction = {
    type: typeof MODAL.CLOSE
} | {
    type: typeof MODAL.OPEN_EXTERNAL_WALLET,
    id: string,
    url: string,
};

export const onPinSubmit = (value: string): Action => {
    TrezorConnect.uiResponse({ type: UI.RECEIVE_PIN, payload: value });
    return {
        type: MODAL.CLOSE,
    };
};

export const onPassphraseSubmit = (passphrase: string): AsyncAction => async (dispatch: Dispatch): Promise<void> => {
    await TrezorConnect.uiResponse({
        type: UI.RECEIVE_PASSPHRASE,
        payload: {
            value: passphrase,
            save: true,
        },
    });

    dispatch({
        type: MODAL.CLOSE,
    });
};

export const onRememberDevice = (device: TrezorDevice): Action => ({
    type: CONNECT.REMEMBER,
    device,
});

export const onForgetDevice = (device: TrezorDevice): Action => ({
    type: CONNECT.FORGET,
    device,
});

export const onForgetSingleDevice = (device: TrezorDevice): Action => ({
    type: CONNECT.FORGET_SINGLE,
    device,
});

export const onCancel = (): Action => ({
    type: MODAL.CLOSE,
});

export const onDuplicateDevice = (device: TrezorDevice): ThunkAction => (dispatch: Dispatch): void => {
    dispatch(onCancel());

    dispatch({
        type: CONNECT.DUPLICATE,
        device,
    });
};

export const onRememberRequest = (prevState: State): ThunkAction => (dispatch: Dispatch, getState: GetState): void => {
    const state: State = getState().modal;
    // handle case where forget modal is already opened
    // TODO: 2 modals at once (two devices disconnected in the same time)
    if (prevState.context === MODAL.CONTEXT_DEVICE && prevState.windowType === CONNECT.REMEMBER_REQUEST) {
        // forget current (new)
        if (state.context === MODAL.CONTEXT_DEVICE) {
            dispatch({
                type: CONNECT.FORGET,
                device: state.device,
            });
        }

        // forget previous (old)
        dispatch({
            type: CONNECT.FORGET,
            device: prevState.device,
        });
    }
};

export const onDeviceConnect = (device: Device): ThunkAction => (dispatch: Dispatch, getState: GetState): void => {
    // interrupt process of remembering device (force forget)
    // TODO: the same for disconnect more than 1 device at once
    const { modal } = getState();
    if (modal.context === MODAL.CONTEXT_DEVICE && modal.windowType === CONNECT.REMEMBER_REQUEST) {
        if (device.features && modal.device && modal.device.features && modal.device.features.device_id === device.features.device_id) {
            dispatch({
                type: MODAL.CLOSE,
            });
        } else {
            dispatch({
                type: CONNECT.FORGET,
                device: modal.device,
            });
        }
    }
};

export const onWalletTypeRequest = (device: TrezorDevice, hidden: boolean, state: ?string): ThunkAction => (dispatch: Dispatch): void => {
    dispatch({
        type: MODAL.CLOSE,
    });
    dispatch({
        type: CONNECT.RECEIVE_WALLET_TYPE,
        device,
        hidden,
        state,
    });
};

export const gotoExternalWallet = (id: string, url: string): ThunkAction => (dispatch: Dispatch): void => {
    console.warn('OPEN', id, url);
    dispatch({
        type: MODAL.OPEN_EXTERNAL_WALLET,
        id,
        url,
    });
};


export default {
    onPinSubmit,
    onPassphraseSubmit,
    // askForRemember,
    onRememberDevice,
    onForgetDevice,
    onForgetSingleDevice,
    onCancel,
    onDuplicateDevice,
    onWalletTypeRequest,
    gotoExternalWallet,
};
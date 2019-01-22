/* eslint-disable import/no-named-as-default-member */
/* @flow */

import TrezorConnect, { UI } from 'trezor-connect';
import type { Device } from 'trezor-connect';
import * as MODAL from 'actions/constants/modal';
import * as CONNECT from 'actions/constants/TrezorConnect';

import type {
    ThunkAction, AsyncAction, Action, GetState, Dispatch, TrezorDevice,
} from 'flowtype';
import type { State } from 'reducers/ModalReducer';
import type { parsedURI } from 'utils/cryptoUriParser';

import sendEthereumFormActions from './ethereum/SendFormActions';
import sendRippleFormActions from './ripple/SendFormActions';

export type ModalAction = {
    type: typeof MODAL.CLOSE
} | {
    type: typeof MODAL.OPEN_EXTERNAL_WALLET,
    id: string,
    url: string,
} | {
    type: typeof MODAL.OPEN_SCAN_QR,
};


export const onPinSubmit = (value: string): Action => {
    TrezorConnect.uiResponse({ type: UI.RECEIVE_PIN, payload: value });
    return {
        type: MODAL.CLOSE,
    };
};

export const onPassphraseSubmit = (passphrase: string): AsyncAction => async (dispatch: Dispatch, getState: GetState): Promise<void> => {
    const { modal } = getState();
    if (modal.context !== MODAL.CONTEXT_DEVICE) return;

    if (passphrase === '') {
        // set standard wallet type if passphrase is blank
        dispatch({
            type: CONNECT.UPDATE_WALLET_TYPE,
            device: modal.device,
            hidden: false,
        });
    }

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

export const onWalletTypeRequest = (hidden: boolean): ThunkAction => (dispatch: Dispatch, getState: GetState): void => {
    const { modal } = getState();
    if (modal.context !== MODAL.CONTEXT_DEVICE) return;
    dispatch({
        type: MODAL.CLOSE,
    });
    dispatch({
        type: CONNECT.RECEIVE_WALLET_TYPE,
        device: modal.device,
        hidden,
    });
};

export const gotoExternalWallet = (id: string, url: string): ThunkAction => (dispatch: Dispatch): void => {
    dispatch({
        type: MODAL.OPEN_EXTERNAL_WALLET,
        id,
        url,
    });
};

export const openQrModal = (): ThunkAction => (dispatch: Dispatch): void => {
    dispatch({
        type: MODAL.OPEN_SCAN_QR,
    });
};

export const onQrScan = (parsedUri: parsedURI, networkType: string): ThunkAction => (dispatch: Dispatch): void => {
    const { address = '', amount } = parsedUri;
    switch (networkType) {
        case 'ethereum':
            dispatch(sendEthereumFormActions.onAddressChange(address));
            if (amount) dispatch(sendEthereumFormActions.onAmountChange(amount));
            break;
        case 'ripple':
            dispatch(sendRippleFormActions.onAddressChange(address));
            if (amount) dispatch(sendRippleFormActions.onAmountChange(amount));
            break;
        default:
            break;
    }
};


export default {
    onPinSubmit,
    onPassphraseSubmit,
    onRememberDevice,
    onForgetDevice,
    onForgetSingleDevice,
    onCancel,
    onDuplicateDevice,
    onWalletTypeRequest,
    gotoExternalWallet,
    openQrModal,
    onQrScan,
};
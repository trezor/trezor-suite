import TrezorConnect, { UI } from 'trezor-connect';
import * as MODAL from 'actions/constants/modal';
import * as CONNECT from 'actions/constants/TrezorConnect';

export const onPinSubmit = (value) => {
    TrezorConnect.uiResponse({ type: UI.RECEIVE_PIN, payload: value });
    return {
        type: MODAL.CLOSE,
    };
};

export const onPassphraseSubmit = passphrase => async (dispatch, getState) => {
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

export const onRememberDevice = device => ({
    type: CONNECT.REMEMBER,
    device,
});

export const onForgetDevice = device => ({
    type: CONNECT.FORGET,
    device,
});

export const onForgetSingleDevice = device => ({
    type: CONNECT.FORGET_SINGLE,
    device,
});

export const onCancel = () => ({
    type: MODAL.CLOSE,
});

export const onDuplicateDevice = device => (dispatch) => {
    dispatch(onCancel());

    dispatch({
        type: CONNECT.DUPLICATE,
        device,
    });
};

export const onRememberRequest = prevState => (dispatch, getState) => {
    const state = getState().modal;
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

export const onDeviceConnect = device => (dispatch, getState) => {
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

export const onWalletTypeRequest = hidden => (dispatch, getState) => {
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

export const gotoExternalWallet = (id, url) => (dispatch) => {
    dispatch({
        type: MODAL.OPEN_EXTERNAL_WALLET,
        id,
        url,
    });
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
};
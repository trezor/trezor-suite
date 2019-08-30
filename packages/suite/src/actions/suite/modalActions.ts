import TrezorConnect, { UI } from 'trezor-connect';
import { MODAL, SUITE } from '@suite-actions/constants';
import { Action, Dispatch, GetState, TrezorDevice } from '@suite-types';

export type ModalActions =
    | {
          type: typeof MODAL.CLOSE;
      }
    | {
          type: typeof MODAL.OPEN_EXTERNAL_WALLET;
          id: string;
          url: string;
      }
    | {
          type: typeof MODAL.OPEN_SCAN_QR;
      };

export const onCancel = (): Action => ({
    type: MODAL.CLOSE,
});

/**
 * Called from <PinModal /> component
 * Sends pin to `trezor-connect`
 * @param {string} value
 * @returns
 */
export const onPinSubmit = (payload: string) => {
    TrezorConnect.uiResponse({ type: UI.RECEIVE_PIN, payload });
    return onCancel();
};

/**
 * Called from <PassphraseModal /> component
 * Sends passphrase to `trezor-connect`
 * @param {string} passphrase
 */
export const onPassphraseSubmit = (value: string) => async (
    dispatch: Dispatch,
    getState: GetState,
) => {
    const { device } = getState().suite;
    if (!device) return;

    if (value === '') {
        // set standard wallet type if passphrase is blank
        dispatch({
            type: SUITE.UPDATE_PASSPHRASE_MODE,
            payload: device,
            hidden: false,
        });
    }

    await TrezorConnect.uiResponse({
        type: UI.RECEIVE_PASSPHRASE,
        payload: {
            value,
            save: true,
        },
    });

    dispatch(onCancel());
};

export const onReceiveConfirmation = (confirmation: any) => async (dispatch: Dispatch) => {
    await TrezorConnect.uiResponse({
        type: UI.RECEIVE_CONFIRMATION,
        payload: confirmation,
    });

    dispatch(onCancel());
};

// TODO: this method is only a placeholder
export const onRememberDevice = (payload: TrezorDevice): Action => ({
    type: SUITE.REMEMBER_DEVICE,
    payload,
});

export const onForgetDevice = (payload: TrezorDevice): Action => ({
    type: SUITE.FORGET_DEVICE,
    payload,
});

export const onForgetDeviceInstance = (payload: TrezorDevice): Action => ({
    type: SUITE.FORGET_DEVICE_INSTANCE,
    payload,
});

export const onRequestInstance = (payload: TrezorDevice) => (dispatch: Dispatch) => {
    dispatch({
        type: SUITE.REQUEST_DEVICE_INSTANCE,
        payload,
    });
};

/*
export const onRememberRequest = (prevState: State) => (
    dispatch: Dispatch,
    getState: GetState,
): void => {
    const state: State = getState().modal;
    // handle case where forget modal is already opened
    // TODO: 2 modals at once (two devices disconnected in the same time)
    if (
        prevState.context === MODAL.CONTEXT_DEVICE &&
        prevState.windowType === CONNECT.REMEMBER_REQUEST
    ) {
        // forget current (new)
        if (state.context === MODAL.CONTEXT_DEVICE) {
            dispatch({
                type: SUITE.FORGET_DEVICE,
                device: state.device,
            });
        }

        // forget previous (old)
        dispatch({
            type: SUITE.FORGET_DEVICE,
            device: prevState.device,
        });
    }
};
*/

/*
export const onDeviceConnect = (device: Device) => (
    dispatch: Dispatch,
    getState: GetState,
): void => {
    // interrupt process of remembering device (force forget)
    // TODO: the same for disconnect more than 1 device at once
    const { modal } = getState();
    if (modal.context === MODAL.CONTEXT_DEVICE && modal.windowType === CONNECT.REMEMBER_REQUEST) {
        if (
            device.features &&
            modal.device &&
            modal.device.features &&
            modal.device.features.device_id === device.features.device_id
        ) {
            dispatch({
                type: MODAL.CLOSE,
            });
        } else {
            dispatch({
                type: SUITE.FORGET_DEVICE,
                device: modal.device,
            });
        }
    }
};
*/

export const onWalletTypeRequest = (hidden: boolean) => (
    dispatch: Dispatch,
    getState: GetState,
): void => {
    const { device } = getState().suite;
    if (!device) return;
    dispatch({
        type: SUITE.RECEIVE_PASSPHRASE_MODE,
        payload: device,
        hidden,
    });
    dispatch(onCancel());
};

export const gotoExternalWallet = (id: string, url: string) => (dispatch: Dispatch): void => {
    dispatch({
        type: MODAL.OPEN_EXTERNAL_WALLET,
        id,
        url,
    });
};

export const openQrModal = () => (dispatch: Dispatch): void => {
    dispatch({
        type: MODAL.OPEN_SCAN_QR,
    });
};

/*
export const onQrScan = (parsedUri: parsedURI, networkType: string) => (dispatch: Dispatch) => {
    const { address = '', amount } = parsedUri;
    switch (networkType) {
        case 'ethereum':
            // dispatch(sendEthereumFormActions.onAddressChange(address));
            // if (amount) dispatch(sendEthereumFormActions.onAmountChange(amount));
            break;
        case 'ripple':
            // dispatch(sendRippleFormActions.onAddressChange(address));
            // if (amount) dispatch(sendRippleFormActions.onAmountChange(amount));
            break;
        default:
            break;
    }
};
*/

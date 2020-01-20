import TrezorConnect, { UI } from 'trezor-connect';
import { MODAL, SUITE } from '@suite-actions/constants';
import { Action, Dispatch, GetState } from '@suite-types';

export type ModalActions =
    | {
          type: typeof MODAL.CLOSE;
      }
    | {
          type: typeof MODAL.OPEN_SCAN_QR;
          outputId: number;
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
export const onPinSubmit = (payload: string) => () => {
    TrezorConnect.uiResponse({ type: UI.RECEIVE_PIN, payload });
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

    TrezorConnect.uiResponse({
        type: UI.RECEIVE_PASSPHRASE,
        payload: {
            value,
            save: true,
        },
    });
};

export const onReceiveConfirmation = (confirmation: boolean) => async (dispatch: Dispatch) => {
    TrezorConnect.uiResponse({
        type: UI.RECEIVE_CONFIRMATION,
        payload: confirmation,
    });

    dispatch(onCancel());
};

export const openQrModal = (outputId: number) => (dispatch: Dispatch): void => {
    dispatch({
        type: MODAL.OPEN_SCAN_QR,
        outputId,
    });
};

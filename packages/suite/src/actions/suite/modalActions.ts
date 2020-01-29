import TrezorConnect, { UI } from 'trezor-connect';
import { MODAL, SUITE } from '@suite-actions/constants';
import { Action, Dispatch, GetState, TrezorDevice } from '@suite-types';

export type UserContextPayload =
    | {
          type: 'qr-reader';
          outputId: number;
      }
    | {
          type: 'unverified-address';
          device: TrezorDevice;
          addressPath: string;
      }
    | {
          type: 'add-account';
          device: TrezorDevice;
      }
    | {
          type: 'device-background-gallery';
          device: TrezorDevice;
      }
    | {
          type: 'transaction-detail';
          txid: string;
      }
    | {
          type: 'log';
      };

export type ModalActions =
    | {
          type: typeof MODAL.CLOSE;
      }
    | {
          type: typeof MODAL.OPEN_USER_CONTEXT;
          payload: UserContextPayload;
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
export const onPassphraseSubmit = (value: string, passphraseOnDevice?: boolean) => async (
    dispatch: Dispatch,
    getState: GetState,
) => {
    const { device } = getState().suite;
    if (!device) return;

    if (!passphraseOnDevice && value === '') {
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
            passphraseOnDevice,
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

export const openModal = (payload: UserContextPayload): Action => ({
    type: MODAL.OPEN_USER_CONTEXT,
    payload,
});

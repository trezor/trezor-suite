import TrezorConnect, { UI, TokenInfo, PrecomposedTransaction } from 'trezor-connect';
import { MODAL, SUITE } from '@suite-actions/constants';
import { useForm } from 'react-hook-form';
import { SendContext } from '@wallet-hooks/useSendContext';
import { Action, Dispatch, GetState, TrezorDevice } from '@suite-types';
import { Account, WalletAccountTransaction } from '@wallet-types';

export type UserContextPayload =
    | {
          type: 'qr-reader';
          outputId: number;
          setValue: ReturnType<typeof useForm>['setValue'];
      }
    | {
          type: 'unverified-address';
          device: TrezorDevice;
          address: string;
          addressPath: string;
          symbol: Account['symbol'];
          networkType: Account['networkType'];
      }
    | {
          type: 'address';
          device: TrezorDevice;
          address: string;
          addressPath: string;
          symbol: Account['symbol'];
          networkType: Account['networkType'];
          cancelable?: boolean;
      }
    | {
          type: 'xpub';
          xpub: string;
          accountPath: string;
          accountIndex: number;
          accountType: Account['accountType'];
          symbol: Account['symbol'];
      }
    | {
          type: 'passphrase-duplicate';
          device: TrezorDevice;
          duplicate: TrezorDevice;
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
          tx: WalletAccountTransaction;
      }
    | {
          type: 'review-transaction';
          transactionInfo: PrecomposedTransaction;
          outputs: SendContext['outputs'];
          token: TokenInfo | null;
          getValues: ReturnType<typeof useForm>['getValues'];
          selectedFee: SendContext['selectedFee'];
          reset: ReturnType<typeof useForm>['reset'];
          setSelectedFee: SendContext['setSelectedFee'];
          showAdvancedForm: SendContext['showAdvancedForm'];
          setToken: SendContext['setToken'];
          updateOutputs: SendContext['updateOutputs'];
          initialSelectedFee: SendContext['initialSelectedFee'];
          defaultValues: SendContext['defaultValues'];
      }
    | {
          type: 'log';
      }
    | {
          type: 'pin-mismatch';
      }
    | {
          type: 'wipe-device';
      }
    | {
          type: 'disconnect-device';
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

export const onPinCancel = () => {
    TrezorConnect.cancel('pin-cancelled');
};

/**
 * Called from <PassphraseModal /> component
 * Sends passphrase to `trezor-connect`
 * @param {string} passphrase
 */
export const onPassphraseSubmit = (
    value: string,
    passphraseOnDevice: boolean,
    hasEmptyPassphraseWallet: boolean,
) => async (dispatch: Dispatch, getState: GetState) => {
    const { device } = getState().suite;
    if (!device) return;

    // update wallet type only on certain conditions
    const update =
        !hasEmptyPassphraseWallet &&
        !passphraseOnDevice &&
        !device.authConfirm &&
        !device.state &&
        value === '';

    if (update) {
        // set standard wallet type if passphrase is blank
        dispatch({
            type: SUITE.UPDATE_PASSPHRASE_MODE,
            payload: device,
            hidden: false,
        });
    }

    if (passphraseOnDevice) {
        dispatch({
            type: SUITE.UPDATE_PASSPHRASE_MODE,
            payload: device,
            hidden: true,
            alwaysOnDevice: true,
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

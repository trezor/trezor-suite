import TrezorConnect from 'trezor-connect';
import { validateAddress } from '@wallet-utils/ethUtils';
import * as notificationActions from '@suite-actions/notificationActions';
import { SIGN_VERIFY } from './constants';
import { Dispatch, GetState } from '@suite-types';

export type inputNameType =
    | 'signAddress'
    | 'signMessage'
    | 'signSignature'
    | 'verifyAddress'
    | 'verifyMessage'
    | 'verifySignature';

export type SignVerifyAction =
    | { type: typeof SIGN_VERIFY.SIGN_SUCCESS; signSignature: string }
    | { type: typeof SIGN_VERIFY.CLEAR_SIGN }
    | { type: typeof SIGN_VERIFY.CLEAR_VERIFY }
    | { type: typeof SIGN_VERIFY.INPUT_CHANGE; inputName: inputNameType; value: string }
    | { type: typeof SIGN_VERIFY.TOUCH; inputName: inputNameType }
    | { type: typeof SIGN_VERIFY.ERROR; inputName: inputNameType; message?: string };

export const sign =
    (path: [number], message: string, hex = false) =>
    async (dispatch: Dispatch, getState: GetState) => {
        const selectedDevice = getState().suite.device;
        if (!selectedDevice) return;

        const response = await TrezorConnect.ethereumSignMessage({
            device: {
                path: selectedDevice.path,
                instance: selectedDevice.instance,
                state: selectedDevice.state,
            },
            path,
            hex,
            message,
            useEmptyPassphrase: selectedDevice.useEmptyPassphrase,
        });

        if (response && response.success) {
            dispatch({
                type: SIGN_VERIFY.SIGN_SUCCESS,
                signSignature: response.payload.signature,
            });
        } else {
            dispatch(
                notificationActions.addToast({
                    type: 'sign-message-error',
                    error: response.payload.error,
                }),
            );
        }
    };

export const verify =
    (address: string, message: string, signature: string, hex = false) =>
    async (dispatch: Dispatch, getState: GetState) => {
        const selectedDevice = getState().suite.device;
        if (!selectedDevice) return;
        const error = validateAddress(address);

        if (error) {
            dispatch({
                type: SIGN_VERIFY.ERROR,
                inputName: 'verifyAddress',
                message: error,
            });
        }

        if (!error) {
            const response = await TrezorConnect.ethereumVerifyMessage({
                device: {
                    path: selectedDevice.path,
                    instance: selectedDevice.instance,
                    state: selectedDevice.state,
                },
                address,
                message,
                signature,
                hex,
                useEmptyPassphrase: selectedDevice.useEmptyPassphrase,
            });

            if (response && response.success) {
                dispatch(
                    notificationActions.addToast({
                        type: 'verify-message-success',
                    }),
                );
            } else {
                dispatch(
                    notificationActions.addToast({
                        type: 'verify-message-error',
                        error: response.payload.error,
                    }),
                );
            }
        }
    };

export const inputChange = (inputName: inputNameType, value: string) => (dispatch: Dispatch) => {
    dispatch({
        type: SIGN_VERIFY.INPUT_CHANGE,
        inputName,
        value,
    });
    dispatch({
        type: SIGN_VERIFY.TOUCH,
        inputName,
    });

    if (inputName === 'verifyAddress') {
        const error = validateAddress(value);
        if (error) {
            dispatch({
                type: SIGN_VERIFY.ERROR,
                inputName,
                message: error,
            });
        }
    }
};

export const clearSign = (): SignVerifyAction => ({
    type: SIGN_VERIFY.CLEAR_SIGN,
});

export const clearVerify = (): SignVerifyAction => ({
    type: SIGN_VERIFY.CLEAR_VERIFY,
});

import { Dispatch, GetState } from '@suite-types/index';
import TrezorConnect from 'trezor-connect';
import { validateAddress } from '@suite/utils/wallet/ethUtils';
import { NOTIFICATION } from '@wallet-actions/constants';
import messages from '@wallet-components/notifications/actions.messages';
import { SIGN_VERIFY } from './constants';

export type SignVerifyAction =
    | { type: typeof SIGN_VERIFY.SIGN_SUCCESS; signSignature: string }
    | { type: typeof SIGN_VERIFY.CLEAR_SIGN }
    | { type: typeof SIGN_VERIFY.CLEAR_VERIFY }
    | { type: typeof SIGN_VERIFY.INPUT_CHANGE; inputName: string; value: string }
    | { type: typeof SIGN_VERIFY.TOUCH; inputName: string }
    | { type: typeof SIGN_VERIFY.ERROR; inputName: string; message?: string };

const sign = (path: [number], message: string, hex: boolean = false) => async (
    dispatch: Dispatch,
    getState: GetState,
): Promise<void> => {
    const selected = getState().suite.device;
    if (!selected) return;

    // @ts-ignore
    const response = await TrezorConnect.ethereumSignMessage({
        device: {
            path: selected.path,
            instance: selected.instance,
            state: selected.state,
        },
        path,
        hex,
        message,
        useEmptyPassphrase: selected.useEmptyPassphrase,
    });

    if (response && response.success) {
        dispatch({
            type: SIGN_VERIFY.SIGN_SUCCESS,
            signSignature: response.payload.signature,
        });
    } else {
        dispatch({
            type: NOTIFICATION.ADD,
            payload: {
                variant: 'error',
                title: messages.TR_SIGN_MESSAGE_ERROR,
                message: response.payload.error,
                cancelable: true,
            },
        });
    }
};

const verify = (
    address: string,
    message: string,
    signature: string,
    hex: boolean = false,
) => async (dispatch: Dispatch, getState: GetState): Promise<void> => {
    const selected = getState().suite.device;
    if (!selected) return;
    const error = validateAddress(address);

    if (error) {
        dispatch({
            type: SIGN_VERIFY.ERROR,
            inputName: 'verifyAddress',
            message: error,
        });
    }

    if (!error) {
        // @ts-ignore // TODO ADD TO CONNECT
        const response = await TrezorConnect.ethereumVerifyMessage({
            device: {
                path: selected.path,
                instance: selected.instance,
                state: selected.state,
            },
            address,
            message,
            signature,
            hex,
            useEmptyPassphrase: selected.useEmptyPassphrase,
        });

        if (response && response.success) {
            dispatch({
                type: NOTIFICATION.ADD,
                payload: {
                    variant: 'success',
                    title: messages.TR_VERIFY_MESSAGE_SUCCESS,
                    message: messages.TR_SIGNATURE_IS_VALID,
                    cancelable: true,
                },
            });
        } else {
            dispatch({
                type: NOTIFICATION.ADD,
                payload: {
                    variant: 'error',
                    title: messages.TR_VERIFY_MESSAGE_ERROR,
                    message: response.payload.error,
                    cancelable: true,
                },
            });
        }
    }
};

const inputChange = (inputName: string, value: string) => (dispatch: Dispatch): void => {
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

const clearSign = () => (dispatch: Dispatch): void => {
    dispatch({
        type: SIGN_VERIFY.CLEAR_SIGN,
    });
};

const clearVerify = () => (dispatch: Dispatch): void => {
    dispatch({
        type: SIGN_VERIFY.CLEAR_VERIFY,
    });
};

export default {
    sign,
    verify,
    clearSign,
    clearVerify,
    inputChange,
};

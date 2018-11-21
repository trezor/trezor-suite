/* @flow */
import TrezorConnect from 'trezor-connect';
import type {
    GetState, Dispatch, ThunkAction, AsyncAction,
} from 'flowtype';
import * as NOTIFICATION from 'actions/constants/notification';
import * as SIGN_VERIFY from './constants/signVerify';

export type SignVerifyAction = {
    type: typeof SIGN_VERIFY.SIGN_SUCCESS,
    signature: string
} | {
    type: typeof SIGN_VERIFY.CLEAR,
}

const sign = (
    path: Array<number>,
    message: string,
    hex: boolean = false,
): AsyncAction => async (dispatch: Dispatch, getState: GetState): Promise<void> => {
    const selected = getState().wallet.selectedDevice;
    if (!selected) return;

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
            signature: response.payload.signature,
        });
    } else {
        dispatch({
            type: NOTIFICATION.ADD,
            payload: {
                type: 'error',
                title: 'Sign error',
                message: response.payload.error,
                cancelable: true,
                actions: [{
                    label: 'Try again',
                    callback: () => {
                        dispatch(sign(path, message, hex));
                    },
                },
                ],
            },
        });
    }
};

const verify = (
    address: string,
    message: string,
    signature: string,
    hex: boolean = false,
): AsyncAction => async (dispatch: Dispatch, getState: GetState): Promise<void> => {
    const selected = getState().wallet.selectedDevice;
    if (!selected) return;

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
                type: 'success',
                title: 'Verify success',
                message: 'signature is valid',
                cancelable: true,
            },
        });
    } else {
        dispatch({
            type: NOTIFICATION.ADD,
            payload: {
                type: 'error',
                title: 'Verify error',
                message: response.payload.error,
                cancelable: true,
                actions: [
                    {
                        label: 'Try again',
                        callback: () => {
                            dispatch(verify(address, message, signature, hex));
                        },
                    },
                ],
            },
        });
    }
};

const clear = (): ThunkAction => (dispatch: Dispatch): void => {
    dispatch({
        type: SIGN_VERIFY.CLEAR,
    });
};

export default {
    sign,
    verify,
    clear,
};
/* @flow */
import TrezorConnect from 'trezor-connect';
import type { GetState, Dispatch } from 'flowtype';
import * as NOTIFICATION from 'actions/constants/notification';
import * as SIGN_VERIFY from './constants/signVerify';

export const sign = (
    path: Array<number>,
    message: string,
    hex: boolean = false,
): AsyncAction => async (dispatch: Dispatch, getState: GetState): Promise<void> => {
    const selected = getState().wallet.selectedDevice;
    const devicePath = selected.path;
    const device = {
        path: devicePath,
        instance: selected.instance,
        state: selected.state,
    };

    const response = await TrezorConnect.ethereumSignMessage({
        device,
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
                        dispatch(() => {});
                    },
                },
                ],
            },
        });
    }
};

export const verify = (
    address: string,
    message: string,
    signature: string,
    hex: boolean = false,
): AsyncAction => async (dispatch: Dispatch): Promise<void> => {
    const input = {
        address,
        message,
        signature,
        hex,
    };
    const response = await TrezorConnect.ethereumVerifyMessage(input);

    if (response && response.success) {
        dispatch({
            type: SIGN_VERIFY.VERIFY_SUCCESS,
            signature: response.payload.success,
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
                            dispatch(() => {});
                        },
                    },
                ],
            },
        });
    }
};


export const clear = (): ThunkAction => (dispatch: Dispatch): void => {
    dispatch({
        type: SIGN_VERIFY.CLEAR,
        signature: '',
    });
};
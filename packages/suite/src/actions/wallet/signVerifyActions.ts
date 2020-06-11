import TrezorConnect from 'trezor-connect';
import { isAddressValid } from '@wallet-utils/validation';
import * as notificationActions from '@suite-actions/notificationActions';
import { SIGN_VERIFY } from './constants';
import { GetState, Dispatch, ExtendedMessageDescriptor } from '@suite-types';

export type inputNameType =
    | 'signAddress'
    | 'signMessage'
    | 'signSignature'
    | 'verifyAddress'
    | 'verifyMessage'
    | 'verifySignature';

export type SignVerifyActions =
    | { type: typeof SIGN_VERIFY.SIGN_SUCCESS; signSignature: string }
    | { type: typeof SIGN_VERIFY.CLEAR_SIGN }
    | { type: typeof SIGN_VERIFY.CLEAR_VERIFY }
    | { type: typeof SIGN_VERIFY.INPUT_CHANGE; inputName: inputNameType; value: string }
    | { type: typeof SIGN_VERIFY.TOUCH; inputName: inputNameType }
    | {
          type: typeof SIGN_VERIFY.ERROR;
          inputName: inputNameType;
          message: ExtendedMessageDescriptor['id'];
      };

export const sign = (message: string, path: string, hex = false) => async (
    dispatch: Dispatch,
    getState: GetState,
) => {
    const { device } = getState().suite;
    const { account } = getState().wallet.selectedAccount;
    if (!device || !account) return;

    let fn;

    switch (account.networkType) {
        case 'bitcoin': {
            fn = TrezorConnect.signMessage;
            break;
        }
        case 'ethereum': {
            fn = TrezorConnect.ethereumSignMessage;
            break;
        }
        default: {
            fn = () => ({
                success: false,
                payload: {
                    error: `Unsupported network: ${account.networkType}`,
                    code: undefined,
                    signature: '',
                },
            });
            break;
        }
    }

    const params = {
        path,
        coin: account.symbol,
        message,
        hex,
    };

    const response = await fn(params);
    if (response.success) {
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

export const verify = (address: string, message: string, signature: string, hex = false) => async (
    dispatch: Dispatch,
    getState: GetState,
) => {
    const { device } = getState().suite;
    const { account } = getState().wallet.selectedAccount;
    if (!device || !account) return;

    let fn;
    const params = {
        address,
        message,
        signature,
        coin: account.symbol,
        hex,
    };

    switch (account.networkType) {
        case 'bitcoin':
            fn = TrezorConnect.verifyMessage;
            break;
        case 'ethereum':
            fn = TrezorConnect.ethereumVerifyMessage;
            break;
        default:
            fn = () => ({
                success: false,
                payload: {
                    error: `Unsupported network: ${account.networkType}`,
                    code: undefined,
                    signature: '',
                },
            });
            break;
    }

    const response = await fn(params);

    if (response.success) {
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
};

export const inputChange = (inputName: inputNameType, value: string) => (
    dispatch: Dispatch,
    getState: GetState,
) => {
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
        const { account } = getState().wallet.selectedAccount;
        if (!account) return;
        const error = isAddressValid(value, account.symbol) ? null : 'TR_ADDRESS_IS_NOT_VALID';

        if (error) {
            dispatch({
                type: SIGN_VERIFY.ERROR,
                inputName,
                message: error,
            });
        }
    }
};

export const clearSign = (): SignVerifyActions => ({
    type: SIGN_VERIFY.CLEAR_SIGN,
});

export const clearVerify = (): SignVerifyActions => ({
    type: SIGN_VERIFY.CLEAR_VERIFY,
});

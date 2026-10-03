import { type Dispatch } from 'redux';

import { notificationsActions } from '@suite-common/toast-notifications';

export type SignVerifyErrorToast =
    'sign-message-error' | 'verify-message-error' | 'verify-address-error';

export const notifySignSuccess =
    (dispatch: Dispatch) =>
    <T>(result: T) => {
        dispatch(notificationsActions.addToast({ type: 'sign-message-success' }));

        return result;
    };

export const notifyVerifySuccess = (dispatch: Dispatch) => {
    dispatch(notificationsActions.addToast({ type: 'verify-message-success' }));
};

export const notifyVerifyCancelled = (dispatch: Dispatch) => {
    dispatch(notificationsActions.addToast({ type: 'verify-message-cancelled' }));
};

export const notifyError = (dispatch: Dispatch, type: SignVerifyErrorToast) => (error: Error) => {
    dispatch(notificationsActions.addToast({ type, error: error.message }));

    return false as const;
};

import { type Dispatch, createAction } from '@reduxjs/toolkit';

import { type UserContextPayload } from '@suite-common/suite-types';
import TrezorConnect, { UI_RESPONSE, type UiResponseFee } from '@trezor/connect';
import { type DeferredResponse, createDeferred } from '@trezor/utils';

import {
    MODAL_CLOSE,
    MODAL_OPEN_USER_CONTEXT,
    MODAL_PRESERVE,
    MODAL_REMOVE_PRESERVE,
} from './constants';
import { type ModalRootState, selectModalConfirmationRequestId } from './modalReducer';

export type ModalAction =
    | { type: typeof MODAL_CLOSE }
    | { type: typeof MODAL_PRESERVE }
    | { type: typeof MODAL_REMOVE_PRESERVE }
    | {
          type: typeof MODAL_OPEN_USER_CONTEXT;
          payload: UserContextPayload;
      };

export const closeModal = createAction(MODAL_CLOSE);

/**
 * Don't close modals on UI.CLOSE_UI.WINDOW event (closing via modal US), but wait for explicit closing instead
 * (usually coming from a redux action from device, or other sources not directly controlled by Suite UI)
 */
export const preserveModal = createAction(MODAL_PRESERVE);

/**
 * Remove preserve lock from modal; usually those modals are closed, but this is useful when the modal
 * is only replaced by another one, and that one must no longer be preserved.
 */
export const removePreserveModal = createAction(MODAL_REMOVE_PRESERVE);

export const onReceiveConfirmation =
    (confirmation: boolean) => (dispatch: Dispatch, getState: () => ModalRootState) => {
        const requestId = selectModalConfirmationRequestId(getState());
        TrezorConnect.uiResponse({
            type: UI_RESPONSE.RECEIVE_CONFIRMATION,
            payload: confirmation,
            requestId,
        });

        dispatch(closeModal());
    };
export const onReceiveAccount = (accountIndex: number | null) => (dispatch: Dispatch) => {
    if (accountIndex === null) {
        TrezorConnect.cancel();
    } else {
        TrezorConnect.uiResponse({
            type: UI_RESPONSE.RECEIVE_ACCOUNT,
            payload: accountIndex,
        });
    }

    dispatch(closeModal());
};
export const onReceiveFee = (payload: UiResponseFee['payload'] | null) => (dispatch: Dispatch) => {
    if (payload === null) {
        TrezorConnect.cancel();
    } else {
        TrezorConnect.uiResponse({
            type: UI_RESPONSE.RECEIVE_FEE,
            payload,
        });
    }

    dispatch(closeModal());
};

export const openModal = createAction(MODAL_OPEN_USER_CONTEXT, (payload: UserContextPayload) => ({
    payload,
}));

// declare all modals with promises
type DeferredModals = Extract<
    UserContextPayload,
    {
        type:
            | 'qr-reader'
            | 'disable-tor'
            | 'request-enable-tor'
            | 'disable-tor-stop-coinjoin'
            | 'spark-signer-confirmation'
            | 'tor-loading'
            | 'review-transaction'
            | 'import-transaction';
    }
>;
// extract single modal by `type` util
type DeferredModal<T extends DeferredModals['type']> = Extract<DeferredModals, { type: T }>;
// extract params except for `type` and 'decision` util
type DeferredRest<T extends DeferredModals['type']> = Omit<DeferredModal<T>, 'type' | 'decision'>;
// openDeferredModal params (without `decision` field)
type DeferredPayload<T extends DeferredModals['type']> = { type: T } & DeferredRest<T>;

// this overload doesn't work when wrapped by `bindActionCreators` (returns union, TODO: investigate...)
export const openDeferredModal =
    <T extends DeferredModals['type']>(payload: DeferredPayload<T>) =>
    (dispatch: Dispatch) => {
        const dfd = createDeferred<DeferredResponse<DeferredModal<T>['decision']>>();
        dispatch({
            type: MODAL_OPEN_USER_CONTEXT,
            payload: {
                ...payload,
                decision: dfd,
            },
        });
        try {
            return dfd.promise;
        } catch {
            // do nothing, return void
        }
    };

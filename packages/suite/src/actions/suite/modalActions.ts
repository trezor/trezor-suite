import { createAction } from '@reduxjs/toolkit';

import { UserContextPayload } from '@suite-common/suite-types';
import TrezorConnect, { UI_RESPONSE } from '@trezor/connect';
import { DeferredResponse, createDeferred } from '@trezor/utils';

import { MODAL } from 'src/actions/suite/constants';
import { Dispatch } from 'src/types/suite';

export type ModalAction =
    | { type: typeof MODAL.CLOSE }
    | { type: typeof MODAL.PRESERVE }
    | { type: typeof MODAL.REMOVE_PRESERVE }
    | {
          type: typeof MODAL.OPEN_USER_CONTEXT;
          payload: UserContextPayload;
      };

export const onCancel = createAction(MODAL.CLOSE);

/**
 * Don't close modals on UI.CLOSE_UI.WINDOW event (closing via modal US), but wait for explicit closing instead
 * (usually coming from a redux action from device, or other sources not directly controlled by Suite UI)
 */
export const preserve = createAction(MODAL.PRESERVE);

/**
 * Remove preserve lock from modal; usually those modals are closed, but this is useful when the modal
 * is only replaced by another one, and that one must no longer be preserved.
 */
export const removePreserve = createAction(MODAL.REMOVE_PRESERVE);

export const onReceiveConfirmation = (confirmation: boolean) => (dispatch: Dispatch) => {
    TrezorConnect.uiResponse({
        type: UI_RESPONSE.RECEIVE_CONFIRMATION,
        payload: confirmation,
    });

    dispatch(onCancel());
};

export const openModal = createAction(MODAL.OPEN_USER_CONTEXT, (payload: UserContextPayload) => ({
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
        // @ts-expect-error: Tightening types, but I don't know how to resolve this.
        dispatch({
            type: MODAL.OPEN_USER_CONTEXT,
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

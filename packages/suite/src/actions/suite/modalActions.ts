import { createAction } from '@reduxjs/toolkit';

import TrezorConnect, { UI } from '@trezor/connect';
import { createDeferred, DeferredResponse } from '@trezor/utils';
import { UserContextPayload } from '@suite-common/suite-types';

import { MODAL } from 'src/actions/suite/constants';
import { Dispatch } from 'src/types/suite';

export type ModalAction =
    | { type: typeof MODAL.CLOSE }
    | { type: typeof MODAL.PRESERVE }
    | {
          type: typeof MODAL.OPEN_USER_CONTEXT;
          payload: UserContextPayload;
      };

export const onCancel = createAction(MODAL.CLOSE);

/**
 * Don't close modals on UI.CLOSE_UI.WINDOW event but wait for explicit closing instead
 */
export const preserve = () => ({ type: MODAL.PRESERVE });

/**
 * Called from <PinModal /> component
 * Sends pin to `@trezor/connect`
 * @param {string} payload
 * @returns
 */
export const onPinSubmit = (payload: string) => () => {
    TrezorConnect.uiResponse({ type: UI.RECEIVE_PIN, payload });
};

export const onReceiveConfirmation = (confirmation: boolean) => (dispatch: Dispatch) => {
    TrezorConnect.uiResponse({
        type: UI.RECEIVE_CONFIRMATION,
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
            | 'import-transaction'
            | 'coinmarket-buy-terms'
            | 'coinmarket-sell-terms'
            | 'coinmarket-exchange-dex-terms'
            | 'coinmarket-exchange-terms'
            | 'coinmarket-p2p-terms'
            | 'coinmarket-savings-terms';
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
            type: MODAL.OPEN_USER_CONTEXT,
            payload: {
                ...payload,
                decision: dfd,
            },
        });
        try {
            return dfd.promise;
        } catch (error) {
            // do nothing, return void
        }
    };

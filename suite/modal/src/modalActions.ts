import { type Dispatch, createAction, nanoid } from '@reduxjs/toolkit';

import { type UserContextPayload } from '@suite-common/suite-types';
import TrezorConnect, { type DeviceUniquePath, UI_RESPONSE } from '@trezor/connect';
import { type DeferredResponse, createDeferred } from '@trezor/utils';

import {
    MODAL_CLOSE,
    MODAL_OPEN_USER_CONTEXT,
    MODAL_PRESERVE,
    MODAL_PRESERVE_ON_TX_TIMEOUT,
    MODAL_REMOVE_PRESERVE,
} from './constants';
import { selectModalConfirmationRequestId } from './modalSelectors';

export const closeModal = createAction(MODAL_CLOSE);

export const beginStakingDeviceCheck = createAction('@modal/begin-staking-device-check', () => ({
    payload: nanoid(),
}));
export const endStakingDeviceCheck = createAction<{ id: string; abandoned?: boolean }>(
    '@modal/end-staking-device-check',
);

/**
 * Don't close modals on UI_EVENTS.CLOSE_UI_WINDOW event, but wait for explicit closing instead
 * (usually coming from a redux action from device, or other sources not directly controlled by Suite UI)
 */
export const preserveModal = createAction(MODAL_PRESERVE);

/**
 * Remove preserve lock from modal; usually those modals are closed, but this is useful when the modal
 * is only replaced by another one, and that one must no longer be preserved.
 */
export const removePreserveModal = createAction(MODAL_REMOVE_PRESERVE);

/**
 * Keep the device-context modal open for exactly one CLOSE_UI_WINDOW event.
 * Dispatch this before calling TrezorConnect.cancel() on Solana tx timeout so that
 * the expired-transaction UI stays visible instead of flashing and disappearing.
 */
export const preserveModalOnTxTimeout = createAction(MODAL_PRESERVE_ON_TX_TIMEOUT);

type OnReceiveConfirmationThunkState = {
    modal: {
        context: string;
    };
};

export const onReceiveConfirmationThunk =
    (confirmation: boolean) =>
    (dispatch: Dispatch, getState: () => OnReceiveConfirmationThunkState) => {
        const requestId = selectModalConfirmationRequestId(getState());
        TrezorConnect.uiResponse({
            type: UI_RESPONSE.RECEIVE_CONFIRMATION,
            payload: confirmation,
            requestId,
        });

        dispatch(closeModal());
    };

export type CancelOnDisconnect = (
    devicePath: DeviceUniquePath,
) => 'cancelled' | 'close' | undefined;

export const openModal = createAction(
    MODAL_OPEN_USER_CONTEXT,
    (payload: UserContextPayload, cancelOnDisconnect?: CancelOnDisconnect) => ({
        payload,
        meta: cancelOnDisconnect && { cancelOnDisconnect },
    }),
);

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
            | 'earn-yield-tx-simulation'
            | 'tron-stake-consent'
            | 'tron-vote-consent';
    }
>;
// extract single modal by `type` util
type DeferredModal<T extends DeferredModals['type']> = Extract<DeferredModals, { type: T }>;
// extract params except for `type` and 'decision` util
type DeferredRest<T extends DeferredModals['type']> = Omit<DeferredModal<T>, 'type' | 'decision'>;
// openDeferredModal params (without `decision` field)
type DeferredPayload<T extends DeferredModals['type']> = { type: T } & DeferredRest<T>;

type DisconnectOptions<T extends DeferredModals['type']> = {
    devicePath: DeviceUniquePath;
    cancelWith: DeferredResponse<DeferredModal<T>['decision']>;
    onDisconnect?: () => void;
};

type SigningModalType = 'review-transaction' | 'earn-yield-tx-simulation' | 'tron-vote-consent';
type DeferredModalThunk<T extends DeferredModals['type']> = (
    dispatch: Dispatch,
) => Promise<DeferredResponse<DeferredModal<T>['decision']>>;

interface OpenDeferredModal {
    <T extends SigningModalType>(
        payload: DeferredPayload<T>,
        disconnect: DisconnectOptions<T>,
    ): DeferredModalThunk<T>;
    <T extends Exclude<DeferredModals['type'], SigningModalType>>(
        payload: DeferredPayload<T>,
    ): DeferredModalThunk<T>;
}

export const openDeferredModal: OpenDeferredModal =
    <T extends DeferredModals['type']>(
        payload: DeferredPayload<T>,
        disconnect?: DisconnectOptions<T>,
    ) =>
    (dispatch: Dispatch) => {
        const decision = createDeferred<DeferredResponse<DeferredModal<T>['decision']>>();
        let cancelOnDisconnect: CancelOnDisconnect | undefined;

        if (disconnect) {
            let pending = true;
            const { resolve, reject } = decision;
            decision.resolve = value => {
                pending = false;
                resolve(value);
            };
            decision.reject = error => {
                pending = false;
                reject(error);
            };
            cancelOnDisconnect = path => {
                if (disconnect.devicePath !== path) return;
                if (!pending) return 'close';

                decision.resolve(disconnect.cancelWith);
                disconnect.onDisconnect?.();

                return 'cancelled';
            };
        }

        dispatch({
            type: MODAL_OPEN_USER_CONTEXT,
            payload: { ...payload, decision },
            meta: cancelOnDisconnect && { cancelOnDisconnect },
        });

        return decision.promise;
    };

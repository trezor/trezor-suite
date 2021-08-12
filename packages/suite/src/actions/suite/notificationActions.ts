import { NOTIFICATION } from './constants';
import { Dispatch, GetState } from '@suite-types';
import {
    ToastPayload,
    ToastNotification,
    EventPayload,
    EventNotification,
    NotificationEntry,
} from '@suite-reducers/notificationReducer';
import * as notificationUtils from '@suite-utils/notification';

export type NotificationAction =
    | {
          type: typeof NOTIFICATION.TOAST;
          payload: ToastNotification;
      }
    | {
          type: typeof NOTIFICATION.EVENT;
          payload: EventNotification;
      }
    | {
          type: typeof NOTIFICATION.CLOSE;
          payload: number;
      }
    | {
          type: typeof NOTIFICATION.REMOVE;
          payload: NotificationEntry[] | NotificationEntry;
      }
    | {
          type: typeof NOTIFICATION.RESET_UNSEEN;
          payload?: NotificationEntry[];
      };

export const addToast = (payload: ToastPayload) => (dispatch: Dispatch, getState: GetState) => {
    dispatch({
        type: NOTIFICATION.TOAST,
        payload: {
            context: 'toast',
            id: new Date().getTime(),
            device: getState().suite.device,
            seen: true,
            ...payload,
        },
    });
};

export const addEvent = (payload: EventPayload) => (dispatch: Dispatch, getState: GetState) => {
    dispatch({
        type: NOTIFICATION.EVENT,
        payload: {
            context: 'event',
            id: new Date().getTime(),
            device: getState().suite.device,
            ...payload,
        },
    });
};

export const close = (id: number): NotificationAction => ({
    type: NOTIFICATION.CLOSE,
    payload: id,
});

export const resetUnseen = (payload?: NotificationEntry[]): NotificationAction => ({
    type: NOTIFICATION.RESET_UNSEEN,
    payload,
});

export const remove = (payload: NotificationEntry[] | NotificationEntry): NotificationAction => ({
    type: NOTIFICATION.REMOVE,
    payload,
});

export const removeTransactionEvents =
    (txs: { txid: string }[]) => (dispatch: Dispatch, getState: GetState) => {
        txs.forEach(tx => {
            const entries = notificationUtils.findTransactionEvents(
                tx.txid,
                getState().notifications,
            );
            if (entries.length > 0) dispatch(remove(entries));
        });
    };

export const removeAccountEvents =
    (descriptor: string) => (dispatch: Dispatch, getState: GetState) => {
        const entries = notificationUtils.findTransactionEvents(
            descriptor,
            getState().notifications,
        );
        if (entries.length > 0) dispatch(remove(entries));
    };

// TODO: didnt touch it right now. imho not used anywhere now. relates to route handling probably.
// called from RouterService
/*
export const clear = (currentDevice: TrezorDevice, requestedDevice: TrezorDevice) => (
    dispatch: Dispatch,
    getState: GetState,
) => {
    // if route has been changed from device view into something else (like other device, settings...)
    // try to remove all Notifications which are linked to previous device (they are not cancelable by user)
    if (currentDevice !== requestedDevice || currentDevice.instance !== requestedDevice.instance) {
        const entries = getState().notifications.filter(
            entry => typeof entry.devicePath === 'string',
        );
        entries.forEach(entry => {
            if (typeof entry.devicePath === 'string') {
                dispatch({
                    type: NOTIFICATION.CLOSE,
                    payload: {
                        devicePath: entry.devicePath,
                    },
                });
            }
        });
    }
};
*/

import { NOTIFICATION } from './constants';
import { Dispatch, GetState } from '@suite-types';
import {
    ToastPayload,
    ToastNotification,
    EventPayload,
    EventNotification,
} from '@suite-reducers/notificationReducer';

export type NotificationActions =
    | {
          type: typeof NOTIFICATION.TOAST;
          payload: ToastNotification;
      }
    | {
          type: typeof NOTIFICATION.EVENT;
          payload: EventNotification;
      }
    | {
          type: typeof NOTIFICATION.CLOSE | typeof NOTIFICATION.REMOVE;
          payload: number;
      };

export const addToast = (payload: ToastPayload) => (dispatch: Dispatch, getState: GetState) => {
    dispatch({
        type: NOTIFICATION.TOAST,
        payload: {
            context: 'toast',
            id: new Date().getTime(),
            device: getState().suite.device,
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

export const close = (id: number): NotificationActions => ({
    type: NOTIFICATION.CLOSE,
    payload: id,
});

export const remove = (id: number): NotificationActions => ({
    type: NOTIFICATION.REMOVE,
    payload: id,
});

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

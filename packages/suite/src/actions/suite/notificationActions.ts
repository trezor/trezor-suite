import { NOTIFICATION } from './constants';
import { Dispatch, GetState } from '@suite-types';
import { NotificationPayload, NotificationEntry } from '@suite-reducers/notificationReducer';

export type NotificationActions =
    | {
          type: typeof NOTIFICATION.ADD;
          payload: NotificationEntry;
      }
    | {
          type: typeof NOTIFICATION.CLOSE;
          payload: number;
      };

// type Single = Omit<NotificationPayload['type'], 'acquire-error|auth-failed'>;
// type Single = Exclude<NotificationPayload['type'], 'acquire-error' | 'auth-failed' | 'auth-confirm-error'>;
// type WithoutPayload = 'settings-applied' | 'pin-changed' | 'device-wiped' | 'backup-success';
// Generate this from NotificationPayload

// type Add = {
//     (type: 'auth-failed', payload: string): any;
//     (type: 'auth-failed2', error: number): any;
// };

// export const add2: Add = (type: any, payload?: any) => (dispatch: Dispatch, getState: GetState) => {
//     dispatch({
//         type: NOTIFICATION.ADD,
//         payload: {
//             id: new Date().getTime(),
//             device: getState().suite.device,
//             type,
//             payload,
//         },
//     });
// };

export const add = (payload: NotificationPayload) => (dispatch: Dispatch, getState: GetState) => {
    dispatch({
        type: NOTIFICATION.ADD,
        payload: {
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

// import { NotificationProps } from '@trezor/components';
import { RequiredKey } from '@suite/types/utils';
import { NotificationEntry } from '@suite-reducers/notificationReducer';
import { NOTIFICATION } from './constants';

export type NotificationAddPayload = Omit<NotificationEntry, 'key'>;

interface CloseProps {
    key?: string;
    id?: string;
    devicePath?: string;
}

export type NotificationClosePayload =
    | RequiredKey<CloseProps, 'devicePath'>
    | RequiredKey<CloseProps, 'id'>
    | RequiredKey<CloseProps, 'key'>;

export type NotificationActions =
    | {
          type: typeof NOTIFICATION.ADD;
          payload: NotificationAddPayload;
      }
    | {
          type: typeof NOTIFICATION.CLOSE;
          payload?: NotificationClosePayload;
      };

export const add = (payload: NotificationAddPayload): NotificationActions => ({
    type: NOTIFICATION.ADD,
    payload,
});

export const close = (payload: NotificationClosePayload): NotificationActions => ({
    type: NOTIFICATION.CLOSE,
    payload,
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

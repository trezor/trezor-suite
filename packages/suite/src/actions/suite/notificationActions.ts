import * as React from 'react';
import { FormattedMessage } from 'react-intl';
import { NotificationProps } from '@trezor/components';
import { CallbackAction } from '@suite/reducers/suite/notificationReducer';
import { NOTIFICATION } from './constants';
import { GetState, Dispatch, TrezorDevice } from '@suite-types';

export interface NotificationAddPayload {
    variant: NonNullable<NotificationProps['variant']>;
    id?: string;
    devicePath?: string;
    title: React.ReactNode | FormattedMessage.MessageDescriptor;
    message?: React.ReactNode;
    cancelable: boolean;
    actions?: CallbackAction[];
}

interface CloseByKey {
    key: string;
    id?: string;
    devicePath?: string;
}
interface CloseById {
    key?: string;
    id: string;
    devicePath?: string;
}
interface CloseByDevicePath {
    key?: string;
    id?: string;
    devicePath: string;
}

export type NotificationClosePayload = CloseByDevicePath | CloseById | CloseByKey;

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

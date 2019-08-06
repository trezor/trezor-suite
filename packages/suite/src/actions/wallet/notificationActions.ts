import * as React from 'react';
import { FormattedMessage } from 'react-intl';
import { CallbackAction } from '@wallet-reducers/notificationReducer';
import { NOTIFICATION } from './constants';
import { GetState, Dispatch, TrezorDevice } from '@suite-types';
import { Action } from '@wallet-types';

export type NotificationActions =
    | {
          type: typeof NOTIFICATION.ADD;
          payload: {
              variant: string;
              title: React.ReactNode | FormattedMessage.MessageDescriptor;
              message?: React.ReactNode;
              cancelable: boolean;
              actions?: CallbackAction[];
          };
      }
    | {
          type: typeof NOTIFICATION.CLOSE;
          payload?: {
              id?: string;
              devicePath?: string;
          };
      };

export const close = (payload: any = {}): Action => ({
    type: NOTIFICATION.CLOSE,
    payload,
});

// called from RouterService
export const clear = (currentDevice: TrezorDevice, requestedDevice: TrezorDevice) => (
    dispatch: Dispatch,
    getState: GetState,
) => {
    // if route has been changed from device view into something else (like other device, settings...)
    // try to remove all Notifications which are linked to previous device (they are not cancelable by user)
    if (currentDevice !== requestedDevice || currentDevice.instance !== requestedDevice.instance) {
        const entries = getState().wallet.notifications.filter(
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

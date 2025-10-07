import { createMiddlewareWithExtraDeps } from '@suite-common/redux-utils';
import { TrezorPushNotificationType } from '@trezor/connect';

import { deviceActions } from './deviceActions';
import { deviceWipedFromDeviceThunk } from './deviceThunks';

// We need extra.thunks.forgetBluetoothDevice in forgetSingleDevicePersistentDataThunk.
export const preparePushNotificationMiddleware = createMiddlewareWithExtraDeps(
    (action, { next, dispatch }) => {
        if (deviceActions.devicePushNotification.match(action)) {
            switch (action.payload.type) {
                case TrezorPushNotificationType.WIPE:
                    dispatch(deviceWipedFromDeviceThunk());
                    break;
                default:
                    break;
            }
        }

        return next(action);
    },
);

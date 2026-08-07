import { deviceActions } from '@suite-common/device';
import { type AnyAction, createMiddlewareWithExtraDeps } from '@suite-common/redux-utils';
import { TrezorPushNotificationType } from '@trezor/connect';

import { deviceWipedFromDeviceThunk, forgetDeviceThunk } from './deviceThunks';

type PushNotificationMiddlewareState = void;

// We need extra.thunks.forgetBluetoothDevice in forgetSingleDevicePersistentDataThunk.
export const preparePushNotificationMiddleware = createMiddlewareWithExtraDeps<
    void,
    AnyAction,
    PushNotificationMiddlewareState
>((action, { next, dispatch }) => {
    if (deviceActions.devicePushNotification.match(action)) {
        switch (action.payload.type) {
            case TrezorPushNotificationType.WIPE:
                dispatch(deviceWipedFromDeviceThunk());
                break;
            case TrezorPushNotificationType.UNPAIR:
                dispatch(forgetDeviceThunk());
                break;
            default:
                break;
        }
    }

    return next(action);
});

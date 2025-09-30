import { MiddlewareAPI } from 'redux';

import { deviceWipedFromDeviceThunk } from '@suite-common/wallet-core/src/device/deviceThunks';
import { DEVICE, TrezorPushNotificationType } from '@trezor/connect';

import { Action, AppState, Dispatch } from 'src/types/suite';

const trezorPushNotification =
    (api: MiddlewareAPI<Dispatch, AppState>) =>
    (next: Dispatch) =>
    (action: Action): Action => {
        if (action.type === DEVICE.TREZOR_PUSH_NOTIFICATION) {
            switch (action.payload.type) {
                case TrezorPushNotificationType.WIPE:
                    api.dispatch(deviceWipedFromDeviceThunk());
                    break;
                default:
                    break;
            }
        }

        return next(action);
    };

export default trezorPushNotification;

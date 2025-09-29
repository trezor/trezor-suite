import {
    type DecodedTrezorPushNotification,
    TrezorPushNotificationType,
    tpn,
} from '@trezor/protocol';

import { DEVICE } from '../../events/device';
import { TpnWorkflowContext } from '../../types/workflow';

export const trezorPushNotificationHandler = async ({ device, message }: TpnWorkflowContext) => {
    const decoded: DecodedTrezorPushNotification = tpn.decode(message);
    device.lifecycle.emit(DEVICE.TREZOR_PUSH_NOTIFICATION, decoded);

    const { type } = decoded;

    switch (type) {
        case TrezorPushNotificationType.SETTING_CHANGE:
        case TrezorPushNotificationType.PIN_CHANGE:
            await device.acquire();
            await device.getFeatures();
            await device.release();
            break;
        default:
            break;
    }
};

import {
    type DecodedTrezorPushNotification,
    TrezorPushNotificationMode,
    TrezorPushNotificationType,
    tpn,
} from '@trezor/protocol';
import { resolveAfter } from '@trezor/utils';

import { DEVICE } from '../../events/device';
import { TpnWorkflowContext } from '../../types/workflow';
import { getThpChannel } from '../thp';

const deviceHandshake = async (device: TpnWorkflowContext['device']) => {
    await device.acquire();
    await device.getFeatures().catch(() => {});
    await device.release();
};

const deviceHandshakeThp = async (device: TpnWorkflowContext['device']) => {
    await device.setupThp();
    await device.acquire();

    // wait. THP may not be ready yet
    await resolveAfter(1000);

    // try THP pairing without interaction
    const busy = await getThpChannel(device, false);
    if (!busy) {
        // and proceed only if further interaction is not required
        await device.getFeatures();
    } else {
        // otherwise wait for start pairing request
        device.setBusy(busy);
        device.lifecycle.emit(DEVICE.CHANGED);
    }

    await device.release();
};

export const trezorPushNotificationHandler = async ({ device, message }: TpnWorkflowContext) => {
    const decoded: DecodedTrezorPushNotification = tpn.decode(message);
    device.lifecycle.emit(DEVICE.TREZOR_PUSH_NOTIFICATION, decoded);

    const { type, mode } = decoded;

    switch (type) {
        case TrezorPushNotificationType.SETTING_CHANGE:
        case TrezorPushNotificationType.PIN_CHANGE:
            if (!device.isUsed()) {
                if (mode === TrezorPushNotificationMode.BootloaderMode) {
                    await deviceHandshake(device);
                } else {
                    await deviceHandshakeThp(device);
                }
            }
            break;
        case TrezorPushNotificationType.LOCK:
            device.setBusy(
                mode === TrezorPushNotificationMode.BootloaderMode
                    ? 'bootloader-locked'
                    : 'hard-locked',
            );
            device.lifecycle.emit(DEVICE.CHANGED);
            break;
        case TrezorPushNotificationType.UNLOCK:
            if (mode === TrezorPushNotificationMode.BootloaderMode && !device.features) {
                device.setBusy('rebooting');
                await deviceHandshake(device);
            } else if (
                mode === TrezorPushNotificationMode.NormalMode &&
                (!device.features || !device.getThpState())
            ) {
                device.setBusy('rebooting');
                await deviceHandshakeThp(device);
            }
            break;
        case TrezorPushNotificationType.SOFTLOCK:
            device.setBusy('pin-locked');
            device.lifecycle.emit(DEVICE.CHANGED);
            break;
        case TrezorPushNotificationType.SOFTUNLOCK:
            device.setBusy(device.features ? undefined : 'thp-locked');
            device.lifecycle.emit(DEVICE.CHANGED);
            break;
        case TrezorPushNotificationType.BOOT:
            device.reset();
            device.setBusy(
                mode === TrezorPushNotificationMode.BootloaderMode
                    ? 'bootloader-locked'
                    : 'rebooting',
            );
            device.lifecycle.emit(DEVICE.CHANGED);
            break;
        default:
            break;
    }
};

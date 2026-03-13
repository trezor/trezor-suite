import { DEVICE } from '@trezor/connect-common/src/events/device';
import { TrezorPushNotificationMode, TrezorPushNotificationType, tpn } from '@trezor/protocol';
import { resolveAfter } from '@trezor/utils';

import { TpnWorkflowContext } from '../../types/workflow';
import { getThpChannel } from '../thp';

const setupDeviceMode = async (
    device: TpnWorkflowContext['device'],
    mode: TrezorPushNotificationMode,
) => {
    if (mode === TrezorPushNotificationMode.BootloaderMode && !device.features) {
        device.setBusy('rebooting');
        await device.acquire();
        await device.getFeatures();
        await device.release();
    }

    if (
        mode === TrezorPushNotificationMode.NormalMode &&
        (!device.features || !device.getThpState())
    ) {
        device.setBusy('rebooting');
        await device.setupThp();
        await device.acquire();

        // wait. THP may not be ready yet
        await resolveAfter(1000);

        // try THP pairing without interaction
        await getThpChannel(device, false);
        if (device.getThpState()?.phase === 'paired') {
            // and proceed only if further interaction is not required
            await device.getFeatures();
        } else {
            // otherwise wait for start pairing request
            device.setBusy('thp-locked');
            device.lifecycle.emit(DEVICE.CHANGED);
        }

        await device.release();
    }
};

export const trezorPushNotificationHandler = async ({ device, message }: TpnWorkflowContext) => {
    const decodedResult = tpn.decode(message);

    if (!decodedResult.success) return;

    const decoded = decodedResult.payload;

    device.lifecycle.emit(DEVICE.TREZOR_PUSH_NOTIFICATION, decoded);

    const { type, mode } = decoded;

    const modeChanged =
        // normal > bootloader
        (mode === TrezorPushNotificationMode.BootloaderMode &&
            (device.getThpState()?.properties ||
                (device.features && !device.features.bootloader_mode))) ||
        // bootloader > normal
        (mode === TrezorPushNotificationMode.NormalMode && device.features?.bootloader_mode);

    if (modeChanged) {
        device.reset();
        device.setBusy(
            mode === TrezorPushNotificationMode.BootloaderMode ? 'bootloader-locked' : 'rebooting',
        );
        device.lifecycle.emit(DEVICE.CHANGED);
    }

    switch (type) {
        case TrezorPushNotificationType.SETTING_CHANGE:
        case TrezorPushNotificationType.PIN_CHANGE:
        case TrezorPushNotificationType.NOTIFY_POWER_STATUS_CHANGE:
            if (!device.isUsed()) {
                await device.acquire();
                await device.getFeatures();
                await device.release();
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
            await setupDeviceMode(device, decoded.mode);
            break;
        case TrezorPushNotificationType.SOFTLOCK:
            device.setBusy('pin-locked');
            device.lifecycle.emit(DEVICE.CHANGED);
            break;
        case TrezorPushNotificationType.SOFTUNLOCK:
            device.setBusy(device.features ? undefined : 'thp-locked');
            device.lifecycle.emit(DEVICE.CHANGED);
            break;
        default:
            break;
    }
};

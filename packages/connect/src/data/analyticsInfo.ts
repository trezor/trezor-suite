/* eslint-disable no-case-declarations */
import { EventType } from '@trezor/connect-analytics';
import {
    getBootloaderHash,
    getBootloaderVersion,
    getDeviceMode,
    getDeviceModel,
    getFirmwareRevision,
    getFirmwareType,
    getFirmwareVersion,
} from '@trezor/device-utils';
import { CoreMessage, PostMessage, UI_REQUEST } from '../events';
import type { Device } from '../device/Device';

export const enhancePostMessageWithAnalytics = (
    callback: PostMessage,
    message: CoreMessage,
    data: { device?: Device },
) => {
    switch (message.type) {
        case UI_REQUEST.REQUEST_CONFIRMATION:
            const { device } = data;

            callback({
                ...message,
                payload: {
                    ...message.payload,
                    analytics: {
                        type: EventType.DeviceSelected,
                        payload: {
                            mode: getDeviceMode(device),
                            pinProtection: device?.features.pin_protection || '',
                            passphraseProtection: device?.features.passphrase_protection || '',
                            backupType: device?.features.backup_type || 'Bip39',
                            language: device?.features.language || '',
                            model: getDeviceModel(device),
                            vendor: device?.features.vendor || '',
                            firmware: getFirmwareVersion(device),
                            firmwareRevision: getFirmwareRevision(device),
                            firmwareType: getFirmwareType(device),
                            bootloaderHash: getBootloaderHash(device),
                            bootloaderVersion: getBootloaderVersion(device),
                        },
                    },
                },
            });
            break;

        default:
            callback(message);
    }
};

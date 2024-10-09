import { EventType } from '@trezor/connect-analytics';
import { CoreEventMessage, UI_REQUEST } from '../events';
import type { Device } from '../types';

export const enhanceMessageWithAnalytics = (
    message: CoreEventMessage,
    data: { device?: Device },
): CoreEventMessage => {
    switch (message.type) {
        case UI_REQUEST.REQUEST_CONFIRMATION:
            const { device } = data;

            return {
                ...message,
                payload: {
                    ...message.payload,
                    analytics: {
                        type: EventType.DeviceSelected,
                        payload: {
                            mode: device?.mode || '',
                            pinProtection: device?.features?.pin_protection || '',
                            passphraseProtection: device?.features?.passphrase_protection || '',
                            backupType: device?.features?.backup_type || 'Bip39',
                            language: device?.features?.language || '',
                            model: device?.features?.internal_model || '',
                            vendor: device?.features?.vendor || '',
                            // TODO:
                            // I don't want to release @trezor/device-utils into npm just because of this file.
                            // we can probably assign result of getFirmwareVersion to device object directly and remove this utility everywhere
                            // firmware: getFirmwareVersion(device),
                            firmwareRevision: device?.features?.revision || '',
                            firmwareType: device?.firmwareType || '',
                            bootloaderHash: device?.features?.bootloader_hash || '',
                            // TODO: see previous comment
                            // bootloaderVersion: getBootloaderVersion(device),
                        },
                    },
                },
            };

        default:
            return message;
    }
};

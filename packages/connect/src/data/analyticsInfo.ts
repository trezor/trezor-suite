/* eslint-disable no-case-declarations */
// import { EventType } from '@trezor/connect-analytics';
import { CoreEventMessage, UI_REQUEST } from '../events';
import type { Device } from '../types';

// TODO: imho this belongs somewhere to packages/connect-iframe package.
// There I can freely import from anyplace within monorepo without needing
// to release new packages. Having it here means that I would need to
// release 2 new packages to npm which is unjustifiable burden
export const enhancePostMessageWithAnalytics = (
    callback: (message: CoreEventMessage) => void,
    message: CoreEventMessage,
    data: { device?: Device },
) => {
    switch (message.type) {
        case UI_REQUEST.REQUEST_CONFIRMATION:
            const { device } = data;

            callback({
                ...message,
                // @ts-expect-error (EventType.DeviceSelected is inlined here)
                payload: {
                    ...message.payload,
                    analytics: {
                        // todo: type inlined temporarily
                        // type: EventType.DeviceSelected,
                        type: 'device/selected',
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
            });
            break;

        default:
            callback(message);
    }
};

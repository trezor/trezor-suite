import type { MessagesSchema as PROTO } from '@trezor/protobuf';
import { type Result, err, ok } from '@trezor/type-utils';

import {
    type FirmwareVersion,
    MIN_SUPPORTED_FIRMWARE,
    isSupportedFirmware,
} from '../firmware/firmwareSupport';

export type SupportedDevice = {
    firmwareVersion: FirmwareVersion;
    hasPinProtection: boolean;
    hasPassphraseProtection: boolean;
};

export type DeviceRejection =
    | { type: 'bootloader-mode' }
    | { type: 'not-trezor-one' }
    | { type: 'firmware-too-old'; firmwareVersion: FirmwareVersion }
    | { type: 'firmware-too-new'; firmwareVersion: FirmwareVersion }
    | { type: 'not-initialized' };

const TREZOR_ONE_MAJOR_VERSION = 1;

/** Decides from the answer to `Initialize` whether the device is one this app may operate. */
export const evaluateDeviceFeatures = (
    features: PROTO.Features,
): Result<SupportedDevice, DeviceRejection> => {
    // In bootloader mode the version fields describe the bootloader, not the firmware.
    if (features.bootloader_mode) return err({ type: 'bootloader-mode' });

    if (features.major_version !== TREZOR_ONE_MAJOR_VERSION) return err({ type: 'not-trezor-one' });

    const firmwareVersion: FirmwareVersion = [
        features.major_version,
        features.minor_version,
        features.patch_version,
    ];

    if (!isSupportedFirmware(firmwareVersion)) {
        const [, minMinor, minPatch] = MIN_SUPPORTED_FIRMWARE;
        const isTooOld =
            features.minor_version < minMinor ||
            (features.minor_version === minMinor && features.patch_version < minPatch);

        return err({ type: isTooOld ? 'firmware-too-old' : 'firmware-too-new', firmwareVersion });
    }

    if (features.initialized !== true) return err({ type: 'not-initialized' });

    return ok({
        firmwareVersion,
        hasPinProtection: features.pin_protection === true,
        hasPassphraseProtection: features.passphrase_protection === true,
    });
};

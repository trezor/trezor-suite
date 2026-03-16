import { type TranslationKey } from '@suite/intl';
import { type DeviceStatus as ConnectedDeviceStatus } from '@suite-common/suite-utils';
import { isDesktop } from '@trezor/env-utils';

import type { PrerequisiteType } from 'src/types/suite';

const getWarningMessage = ({
    deviceStatus,
    showWarning,
}: {
    deviceStatus: ConnectedDeviceStatus | null;
    showWarning: boolean;
}): {
    heading: TranslationKey;
    description?: TranslationKey;
} => {
    switch (deviceStatus) {
        case 'bootloader':
            return {
                heading: 'TR_DEVICE_CONNECTED_NEW_DEVICE_STATE',
            };
        case 'device-busy':
            return {
                heading: 'TR_DEVICE_CONNECTED_BUSY_BOOTLOADER',
                description: 'TR_DEVICE_CONNECTED_BUSY_BOOTLOADER_DESCRIPTION',
            };
        case 'initialize':
            return {
                heading: 'TR_DEVICE_CONNECTED_INITIAL_DEVICE_STATE',
            };
        default:
            return {
                heading: showWarning ? 'TR_DEVICE_CONNECTED' : 'TR_DEVICE_CONNECTED_WRONG_STATE',
            };
    }
};

type GetMessageIdParams = {
    connected: boolean;
    deviceStatus: ConnectedDeviceStatus | null;
    showWarning: boolean;
    prerequisite: PrerequisiteType | null;
};

export const getMessageId = ({
    connected,
    deviceStatus,
    showWarning,
    prerequisite,
}: GetMessageIdParams): {
    heading: TranslationKey;
    description?: TranslationKey;
} => {
    const getDefaultKey = (): {
        heading: TranslationKey;
        description?: TranslationKey;
    } => {
        if (connected) {
            return getWarningMessage({ deviceStatus, showWarning });
        }

        return {
            heading: 'TR_CONNECT_YOUR_DEVICE',
            description: 'TR_CONNECT_DEVICE_DESCRIPTION',
        };
    };

    const defaultKey = getDefaultKey();

    if (prerequisite === null) {
        return defaultKey;
    }

    const map: Record<
        PrerequisiteType,
        {
            heading: TranslationKey;
            description?: TranslationKey;
        }
    > = {
        'no-transport': {
            heading: isDesktop() ? 'TR_NO_TRANSPORT_DESKTOP' : 'TR_NO_TRANSPORT',
        },
        'device-bootloader': {
            heading: 'TR_DEVICE_CONNECTED_BOOTLOADER',
        },
        'device-used-elsewhere': {
            heading: 'TR_DEVICE_CONNECTED_UNACQUIRED',
        },
        'device-unacquired': {
            heading: 'TR_NEEDS_ATTENTION_UNABLE_TO_CONNECT',
        },
        'device-thp-locked': {
            heading: 'TR_NEEDS_TREZOR_HOST_PROTOCOL_PAIRING',
        },
        'firmware-corrupted': {
            heading: 'TR_FIRMWARE_CORRUPTED_CONNECT_TITLE',
            description: 'TR_FIRMWARE_CORRUPTED_CONNECT_DESCRIPTION',
        },
        'device-busy': { heading: 'TR_NEEDS_ATTENTION_DEVICE_BUSY' }, // device returned Busy error - we don't know exactly why it depends on the workflow
        'device-rebooting': { heading: 'TR_RESTARTING_TREZOR' }, // device is booting to normal mode
        'device-bootloader-locked': { heading: 'TR_NEEDS_ATTENTION_DEVICE_LOCKED' }, // device is  a) rebooting or b) its was rebooted to bootloader
        'device-hard-locked': { heading: 'TR_NEEDS_ATTENTION_DEVICE_LOCKED' }, // device is hard locked and will not respond to messages, unlock it
        'device-disconnect-required': {
            heading: 'TR_INITIAL_RECONNECT_DEVICE_TITLE',
            description: 'TR_INITIAL_RECONNECT_DEVICE_DESCRIPTION',
        },
        'device-disconnected': defaultKey,
        'device-initialize': defaultKey,
        'device-recovery-mode': defaultKey,
        'device-seedless': defaultKey,
        'device-unknown': defaultKey,
        'device-unreadable': defaultKey,
        'firmware-missing': defaultKey,
        'firmware-required': defaultKey,
        'multi-share-backup-in-progress': defaultKey,
    };

    return map[prerequisite];
};

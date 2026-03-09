import {
    Device,
    DeviceUniquePath,
    Features,
    FirmwareType,
    asDeviceUniquePath,
} from '@trezor/connect';
import { DeviceModelInternal } from '@trezor/device-utils';

import { TrezorDevice } from '../src/device';

type StringPath<T extends { path: DeviceUniquePath }> = Omit<T, 'path'> & { path: string };

/**
 * device.firmwareReleaseConfigInfo property
 * note that values don't make much sense.
 */
export const mockGetFirmwareReleaseConfigInfo = (): NonNullable<
    Device['firmwareReleaseConfigInfo']
> => ({
    isRequired: false,
    isNewer: false,
    firmwareType: FirmwareType.Universal,
    isBitcoinOnlyAvailable: true,
    intermediary: undefined,
    releaseConditions: {
        environment: { min_suite_version: '25.2.1', min_suite_native_version: '25.2.1' },
        rollout_probability: 100,
        shouldBeOffered: true,
    },
    release: {
        required: false,
        version: [2, 0, 0],
        min_firmware_version: [2, 0, 0],
        min_bootloader_version: [2, 0, 0],
        url: 'data/firmware/t1b1/trezor-t1b1-1.8.1.bin',
        fingerprint: '019e849c1eb285a03a92bbad6d18a328af3b4dc6999722ebb47677b403a4cd16',
        firmware_revision: 'fad9682201cf9289bba2adb66e6e07ed1cf78936',
        translations: {
            'cs-CZ': 'firmware/translations/t1b1/translation-T2T1-cs-CZ-2.7.2.bin',
            'de-DE': 'firmware/translations/t1b1/translation-T2T1-de-DE-2.7.2.bin',
            'es-ES': 'firmware/translations/t1b1/translation-T2T1-es-ES-2.7.2.bin',
            'fr-FR': 'firmware/translations/t1b1/translation-T2T1-fr-FR-2.7.2.bin',
            'it-IT': 'firmware/translations/t1b1/translation-T2T1-it-IT-2.7.2.bin',
            'pt-BR': 'firmware/translations/t1b1/translation-T2T1-pt-BR-2.7.2.bin',
        },
        changelog: '* Fix fault when using the device with no PIN* Fix OMNI transactions parsing',
    },
});

/**
 * Generate device Features
 * @param {Partial<Features>} [feat]
 * @returns {Features}
 */
const getDeviceFeatures = (feat?: Partial<Features>): Features => {
    const isBootloader = feat?.bootloader_mode;
    const major_version = feat?.major_version || 2;
    const [_, minor_version, patch_version] = isBootloader ? [2, 0, 0] : [2, 1, 1];
    const [fw_major, fw_minor, fw_patch] = isBootloader
        ? [major_version, 1, 1]
        : [null, null, null];
    const firmware_present = isBootloader ? false : null;

    return {
        vendor: 'trezor.io',
        major_version,
        minor_version,
        patch_version,
        bootloader_mode: null,
        device_id: 'device-id',
        pin_protection: false,
        passphrase_protection: false,
        language: 'en-US',
        label: 'My Trezor',
        initialized: true,
        revision: 'df0963ec',
        bootloader_hash: '7447a41717022e3eb32011b00b2a68ebb9c7f603cdc730e7307850a3f4d62a5c',
        imported: null,
        unlocked: true,
        firmware_present,
        backup_availability: 'NotAvailable',
        flags: 0,
        model: 'T',
        internal_model: DeviceModelInternal.T2T1,
        fw_major,
        fw_minor,
        fw_patch,
        fw_vendor: null,
        unfinished_backup: false,
        no_backup: false,
        recovery_status: 'Nothing',
        capabilities: [],
        backup_type: 'Bip39',
        sd_card_present: false,
        sd_protection: false,
        wipe_code_protection: false,
        session_id: 'session-id',
        passphrase_always_on_device: false,
        safety_checks: 'Strict',
        auto_lock_delay_ms: 60000,
        display_rotation: 'North',
        experimental_features: false,
        ...feat,
    };
};

/**
 * Create a simplified mocked Device as emitted from '@trezor/connect'.
 * Note that type inferrence for KnownDevice | UnknownDevice | UnreadableDevice cannot work here because of Partial<>.
 * If you want tighter types in a test, do narrowing with type guards (e.g. throw if not known).
 */
export const mockConnectDevice = (
    dev?: Partial<StringPath<Device>>,
    feat?: Partial<Features>,
): Device => {
    const path = asDeviceUniquePath(dev?.path ?? '1');

    if (dev && typeof dev.type === 'string' && dev.type === 'unreadable') {
        return {
            descriptor: { apiType: 'usb', id: 'device-id' },
            type: 'unreadable',
            path,
            label: 'Unreadable device',
            name: 'name of unreadable device',
            error: 'unreadable device',
            hid: true,
        };
    }

    if (dev && typeof dev.type === 'string' && dev.type === 'unacquired') {
        return {
            descriptor: { apiType: 'usb', id: 'device-id' },
            type: dev.type,
            path,
            label: 'Unacquired device',
            name: 'name of unacquired device',
            transportSessionOwner: 'another app name',
            thp: dev.thp,
            status: dev.status,
        };
    }

    const features = getDeviceFeatures(feat);

    return {
        descriptor: { apiType: 'usb', id: 'device-id' },
        id: features.device_id,
        // @ts-expect-error
        path: '',
        label: 'My Trezor',
        firmware: 'valid',
        firmwareReleaseConfigInfo: mockGetFirmwareReleaseConfigInfo(),
        status: 'available',
        mode: 'normal',
        state: undefined,
        features,
        unavailableCapabilities: {},
        firmwareType:
            feat && feat.capabilities && !feat?.capabilities.includes('Capability_Bitcoin_like')
                ? FirmwareType.BitcoinOnly
                : FirmwareType.Universal,
        name: '',
        availableTranslations: {},
        ...dev,
        error: undefined,
        type: 'acquired',
        authenticityChecks: {
            firmwareRevision: { success: true },
            firmwareHash: { success: true },
        },
    };
};

/**
 * Create a mocked extended device, as processed by wallet-core deviceReducer.
 * Note that type inference for AcquiredDevice | UnknownDevice | UnreadableDevice cannot work here because of Partial<>.
 * If you want tighter types in a test, do narrowing with type guards (e.g. throw if not acquired).
 */
export const mockSuiteDevice = (
    dev?: Partial<StringPath<TrezorDevice>>,
    feat?: Partial<Features>,
): TrezorDevice => {
    const bootloader_mode = dev?.mode === 'bootloader';
    const device = mockConnectDevice(dev, { bootloader_mode, ...feat });
    if (device.type === 'acquired') {
        return {
            useEmptyPassphrase: dev?.state ? true : undefined,
            remember: false,
            connected: false,
            available: false,
            ts: 0,
            buttonRequests: [],
            metadata: {},
            ...dev,
            ...device,
            state: dev?.state,
        } as TrezorDevice;
    }

    return {
        ...device,
        ...dev,
    } as TrezorDevice;
};

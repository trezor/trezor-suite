/* WARNING! This file should be imported ONLY in tests! */

import { DeviceModelInternal } from '@trezor/device-utils';
import { ReleaseInfo } from '@trezor/firmware-release-config/src/types';
import { AbstractApiTransport, UsbApi } from '@trezor/transport';

import { type Features } from './src/types';

class TestTransport extends AbstractApiTransport {
    name = 'TestTransport' as any;
    apiType = 'usb' as const;
}

// mock of navigator.usb
const createTransportApi = (override = {}) =>
    ({
        chunkSize: 0,
        enumerate: () => Promise.resolve({ success: true, payload: [{ path: '1' }] }),
        on: () => {},
        off: () => {},
        openDevice: (path: string) => Promise.resolve({ success: true, payload: [{ path }] }),
        closeDevice: () => Promise.resolve({ success: true }),
        write: () => Promise.resolve({ success: true }),
        read: () =>
            Promise.resolve({
                success: true,
                payload: Buffer.from('3f232300110000000c1002180020006000aa010154', 'hex'), // partial proto.Features
                // payload: Buffer.from('3f23230002000000060a046d656f77', 'hex'), // proto.Success
            }),
        listen: () => {},
        dispose: () => {},
        ...override,
    }) as unknown as UsbApi;

export const createTestTransport = (apiMethods = {}) =>
    new TestTransport({
        api: createTransportApi(apiMethods),
        id: 'foo-bar-id',
        messages: {},
    });

export const getDeviceFeatures = (feat?: Partial<Features>): Features => ({
    vendor: 'trezor.io',
    major_version: 2,
    minor_version: 1,
    patch_version: 1,
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
    firmware_present: null,
    backup_availability: 'NotAvailable',
    flags: 0,
    model: 'T',
    internal_model: DeviceModelInternal.T2T1,
    fw_major: null,
    fw_minor: null,
    fw_patch: null,
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
});

const commonReleaseData: ReleaseInfo = {
    required: false,
    version: [2, 8, 9],
    min_bootloader_version: [2, 1, 6],
    min_firmware_version: [2, 7, 2],
    bootloader_version: [2, 1, 8],
    translations: ['cs-CZ', 'de-DE', 'es-ES', 'fr-FR', 'it-IT', 'pt-BR'],
    firmware_revision: 'fad9682201cf9289bba2adb66e6e07ed1cf78936',
    fingerprint: 'ac995c394f7a7b3ea4cbd9c04977621d6d2fbef30bba856f707f585f34866ac4',
    changelog:
        '* Ability to cancel recovery flow on word count selection screen.\n' +
        '* New UI for confirming long messages.\n' +
        '* Changed "swipe to continue" to "tap to continue". Screens still respond to swipe-up, but the preferred interaction method is now tapping the lower part of the screen.',
};

const getReleaseData = (releaseInfo: Partial<ReleaseInfo> = {}): ReleaseInfo => ({
    ...commonReleaseData,
    ...releaseInfo,
});

declare global {
    // eslint-disable-next-line no-var
    var JestMocks: {
        getDeviceFeatures: typeof getDeviceFeatures;
        createTestTransport: typeof createTestTransport;
        getReleaseData: typeof getReleaseData;
    };

    type TestFixtures<TestedMethod extends (...args: any) => any> = {
        description: string;
        input: Parameters<TestedMethod>;
        output: ReturnType<TestedMethod>;
    }[];
}

global.JestMocks = {
    getDeviceFeatures,
    createTestTransport,
    getReleaseData,
};

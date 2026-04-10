/* WARNING! This file should be imported ONLY in tests! */

import type { Features } from '@trezor/connect-common';
import { firmwareAssets } from '@trezor/connect-data';
import { DeviceModelInternal } from '@trezor/device-utils';
import type { FirmwareRelease } from '@trezor/device-utils';
import { AbstractApiTransport } from '@trezor/transport';
import type { UsbApi } from '@trezor/transport/src/api/usb';
import { versionUtils } from '@trezor/utils';

// mock of navigator.usb
const createTransportApi = (override = {}) =>
    ({
        chunkSize: 0,
        enumerate: () => Promise.resolve({ success: true, payload: [{ path: '1' }] }),
        on: () => {},
        off: () => {},
        once: () => {},
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
        type: 'usb',
        ...override,
    }) as unknown as UsbApi;

export const createTestTransportClass = (apiMethods = {}): any =>
    class TestTransport extends AbstractApiTransport {
        name = 'TestTransport' as any;

        constructor(params: ConstructorParameters<typeof AbstractApiTransport>[0]) {
            super({ ...params, api: createTransportApi(apiMethods) });
        }
    };

export const createTestTransport = (apiMethods = {}): any =>
    new (createTestTransportClass(apiMethods))({ id: 'foo-bar-id', messages: {} });

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

declare global {
    var JestMocks: {
        getDeviceFeatures: typeof getDeviceFeatures;
        createTestTransport: typeof createTestTransport;
        createTestTransportClass: typeof createTestTransportClass;
        releasesT1B1: FirmwareRelease[];
        releasesT2T1: FirmwareRelease[];
    };

    type TestFixtures<TestedMethod extends (...args: any) => any> = {
        description: string;
        input: Parameters<TestedMethod>;
        output: ReturnType<TestedMethod>;
    }[];
}

// T1B1
const releasesT1B1 = Object.values(firmwareAssets.t1b1.universal).sort((a, b) =>
    versionUtils.isNewer(b.version, a.version) ? 1 : -1,
);

// T2T1
const releasesT2T1 = Object.values(firmwareAssets.t2t1.universal).sort((a, b) =>
    versionUtils.isNewer(b.version, a.version) ? 1 : -1,
);

global.JestMocks = {
    getDeviceFeatures,
    createTestTransport,
    createTestTransportClass,
    releasesT1B1,
    releasesT2T1,
};

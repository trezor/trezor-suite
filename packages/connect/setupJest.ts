/* WARNING! This file should be imported ONLY in tests! */

import {
    AbstractApiTransport,
    UsbApi,
    SessionsClient,
    SessionsBackground,
} from '@trezor/transport';
import { DeviceModelInternal, type Features, type FirmwareRelease } from './src/types';

class TestTransport extends AbstractApiTransport {
    name = 'TestTransport' as any;
}

// mock of navigator.usb
const createTransportApi = (override = {}) =>
    ({
        chunkSize: 0,
        enumerate: () => {
            return Promise.resolve({ success: true, payload: [{ path: '1' }] });
        },
        on: () => {},
        off: () => {},
        openDevice: (path: string) => {
            return Promise.resolve({ success: true, payload: [{ path }] });
        },
        closeDevice: () => {
            return Promise.resolve({ success: true });
        },
        write: () => {
            return Promise.resolve({ success: true });
        },
        read: () => {
            return Promise.resolve({
                success: true,
                payload: Buffer.from('3f232300110000000c1002180020006000aa010154', 'hex'), // partial proto.Features
                // payload: Buffer.from('3f23230002000000060a046d656f77', 'hex'), // proto.Success
            });
        },
        ...override,
    }) as unknown as UsbApi;

export const createTestTransport = (apiMethods = {}) => {
    const { signal } = new AbortController();
    const sessionsBackground = new SessionsBackground();
    const sessionsClient = new SessionsClient({
        requestFn: params => sessionsBackground.handleMessage(params),
        registerBackgroundCallbacks: onDescriptorsCallback => {
            sessionsBackground.on('descriptors', descriptors => {
                onDescriptorsCallback(descriptors);
            });
        },
    });

    const transport = new TestTransport({
        api: createTransportApi(apiMethods),
        sessionsClient,
        signal,
    });

    return transport;
};

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
    display_rotation: 0,
    experimental_features: false,
    ...feat,
});

const getRelease = (model: 1 | 2): FirmwareRelease => ({
    required: false,
    version: [model, 0, 0],
    min_firmware_version: [model, 0, 0],
    min_bootloader_version: [model, 0, 0],
    url: 'data/firmware/t1b1/trezor-t1b1-1.8.1.bin',
    fingerprint: '019e849c1eb285a03a92bbad6d18a328af3b4dc6999722ebb47677b403a4cd16',
    changelog: '* Fix fault when using the device with no PIN* Fix OMNI transactions parsing',
});

const getReleaseT1 = (release: any): FirmwareRelease => ({
    ...getRelease(1),
    bootloader_version: [1, 0, 0],
    ...release,
});

const getReleaseT2 = (release: any): FirmwareRelease => ({
    ...getRelease(2),
    ...release,
});

const getReleasesT1 = (releases: Partial<FirmwareRelease>[]) => releases.map(r => getReleaseT1(r));

const getReleasesT2 = (releases: Partial<FirmwareRelease>[]) => releases.map(r => getReleaseT2(r));

declare global {
    // eslint-disable-next-line no-var
    var JestMocks: {
        getDeviceFeatures: typeof getDeviceFeatures;
        getReleaseT1: typeof getReleaseT1;
        getReleaseT2: typeof getReleaseT2;
        getReleasesT1: typeof getReleasesT1;
        getReleasesT2: typeof getReleasesT2;
        createTestTransport: typeof createTestTransport;
    };

    type TestFixtures<TestedMethod extends (...args: any) => any> = {
        description: string;
        input: Parameters<TestedMethod>;
        output: ReturnType<TestedMethod>;
    }[];
}

global.JestMocks = {
    getDeviceFeatures,
    getReleaseT1,
    getReleaseT2,
    getReleasesT1,
    getReleasesT2,
    createTestTransport,
};

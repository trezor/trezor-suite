/* WARNING! This file should be imported ONLY in tests! */

/* eslint-disable @typescript-eslint/naming-convention */
import type { Features } from '@trezor/connect';

import { Release } from './src/utils/parse';

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
    needs_backup: false,
    flags: 0,
    model: 'T',
    fw_major: null,
    fw_minor: null,
    fw_patch: null,
    fw_vendor: null,
    unfinished_backup: false,
    no_backup: false,
    recovery_mode: false,
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

const getRelease = (model: 1 | 2) => ({
    required: false,
    version: [model, 0, 0],
    min_bridge_version: [2, 0, 25],
    min_firmware_version: [model, 0, 0],
    min_bootloader_version: [model, 0, 0],
    url: 'data/firmware/1/trezor-1.8.1.bin',
    fingerprint: '019e849c1eb285a03a92bbad6d18a328af3b4dc6999722ebb47677b403a4cd16',
    changelog: '* Fix fault when using the device with no PIN* Fix OMNI transactions parsing',
});

const getReleaseT1 = (release: any): Release => ({
    ...getRelease(1),
    bootloader_version: [1, 0, 0],
    ...release,
});

const getReleaseT2 = (release: any): Release => ({
    ...getRelease(2),
    ...release,
});

const getReleasesT1 = (releases: Partial<Release>[]) => releases.map(r => getReleaseT1(r));

const getReleasesT2 = (releases: Partial<Release>[]) => releases.map(r => getReleaseT2(r));

declare global {
    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace NodeJS {
        interface Global {
            JestMocks: {
                getDeviceFeatures: typeof getDeviceFeatures;
                getReleaseT1: typeof getReleaseT1;
                getReleaseT2: typeof getReleaseT2;
                getReleasesT1: typeof getReleasesT1;
                getReleasesT2: typeof getReleasesT2;
            };
        }
        interface ProcessEnv {
            RELEASES_T1: string;
            RELEASES_T2: string;
            BASE_FW_URL: string;
        }
    }
}

global.JestMocks = {
    getDeviceFeatures,
    getReleaseT1,
    getReleaseT2,
    getReleasesT1,
    getReleasesT2,
};

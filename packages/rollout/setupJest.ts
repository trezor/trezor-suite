/* WARNING! This file should be imported ONLY in tests! */

/* eslint-disable @typescript-eslint/camelcase */
import { Features } from 'trezor-connect';

import { Release } from './src/utils/parse';

export const getDeviceFeatures = (feat?: Partial<Features>): Features => ({
    device_id: 'device-id',
    flags: 0,
    initialized: true,
    label: 'My Trezor',
    major_version: 2,
    minor_version: 1,
    model: 'T',
    needs_backup: false,
    no_backup: false,
    passphrase_cached: true,
    passphrase_protection: false,
    patch_version: 1,
    pin_cached: false,
    pin_protection: false,
    revision: '3761663164353835',
    unfinished_backup: false,
    vendor: 'trezor.io',
    ...feat,
});

const getRelease = (model: 1 | 2) => {
    return {
        required: false,
        version: [model, 0, 0],
        min_bridge_version: [2, 0, 25],
        min_firmware_version: [model, 0, 0],
        min_bootloader_version: [model, 0, 0],
        url: 'data/firmware/1/trezor-1.8.1.bin',
        fingerprint: '019e849c1eb285a03a92bbad6d18a328af3b4dc6999722ebb47677b403a4cd16',
        changelog: '* Fix fault when using the device with no PIN* Fix OMNI transactions parsing',
    };
};

const getReleaseT1 = (release: any): Release => {
    return {
        ...getRelease(1),
        bootloader_version: [1, 0, 0],
        ...release,
    };
};

const getReleaseT2 = (release: any): Release => {
    return {
        ...getRelease(2),
        ...release,
    };
};

const getReleasesT1 = (releases: Partial<Release>[]) => {
    return releases.map(r => getReleaseT1(r));
};

const getReleasesT2 = (releases: Partial<Release>[]) => {
    return releases.map(r => getReleaseT2(r));
};

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
            BETA_BASE_FW_URL: string;
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

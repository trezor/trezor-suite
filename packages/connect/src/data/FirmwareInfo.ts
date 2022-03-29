import { getInfo } from '@trezor/rollout';
import type { FirmwareRelease, Features } from '../types';

const releases: { [key: number]: FirmwareRelease[] } = {};
releases[1] = [];
releases[2] = [];

// strip "data" directory from download url (default: data.trezor.io)
// it's hard coded in "releases.json" ("mytrezor" dir structure)
const cleanUrl = (url?: string) => {
    if (typeof url !== 'string') return;
    if (url.indexOf('data/') === 0) return url.substring(5);
    return url;
};

export const parseFirmware = (json: any, model: number) => {
    Object.keys(json).forEach(key => {
        const release = json[key];
        releases[model].push({
            ...release,
            url: cleanUrl(release.url),
            url_bitcoinonly: cleanUrl(release.url_bitcoinonly),
        });
    });
};

export const getFirmwareStatus = (features: Features) => {
    // indication that firmware is not installed at all. This information is set to false in bl mode. Otherwise it is null.
    if (features.firmware_present === false) {
        return 'none';
    }
    // for t1 in bootloader, what device reports as firmware version is in fact bootloader version, so we can
    // not safely tell firmware version
    if (features.major_version === 1 && features.bootloader_mode) {
        return 'unknown';
    }
    const info = getInfo({ features, releases: releases[features.major_version] as any }); // REF-TODO: types

    // should not happen, possibly if releases list contains inconsistent data or so
    if (!info) return 'unknown';

    if (info.isRequired) return 'required';

    if (info.isNewer) return 'outdated';

    return 'valid';
};

export const getRelease = (features: Features) =>
    getInfo({ features, releases: releases[features.major_version] as any }); // REF-TODO: types collision

export const getReleases = (model: number) => releases[model];

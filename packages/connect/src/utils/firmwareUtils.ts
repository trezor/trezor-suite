import { createHash } from 'crypto';
import { versionUtils } from '@trezor/utils';
import type { Features, StrictFeatures, FirmwareRelease, VersionArray } from '../types';

export const isStrictFeatures = (extFeatures: Features): extFeatures is StrictFeatures =>
    [1, 2].includes(extFeatures.major_version) &&
    (extFeatures.firmware_present === false ||
        extFeatures.bootloader_mode == null ||
        extFeatures.bootloader_mode === true);

/**
 * Accepts external releases as published here:
 * https://github.com/trezor/webwallet-data/blob/master/firmware/2/releases.json
 * https://github.com/trezor/webwallet-data/blob/master/firmware/1/releases.json
 * and narrows them down into (somewhat more) strongly typed releases.
 *
 * TODO this check should be either more precise or replaced with direct json validation
 */
export const isValidReleases = (extReleases: any): extReleases is FirmwareRelease[] =>
    Array.isArray(extReleases) &&
    extReleases.every(
        release =>
            release.version && release.min_firmware_version && release.min_bootloader_version,
    );

export const getScore = (device_id: string) => {
    const hash = createHash('sha256');
    hash.update(device_id);
    const output = parseInt(hash.digest('hex'), 16) / 2 ** 256;
    return Math.round(output * 100) / 100;
};

export const filterSafeListByBootloader = (
    releasesList: FirmwareRelease[],
    bootloaderVersion: VersionArray,
) =>
    releasesList.filter(
        item =>
            (!item.min_bootloader_version ||
                versionUtils.isNewerOrEqual(bootloaderVersion, item.min_bootloader_version)) &&
            (!item.bootloader_version ||
                versionUtils.isNewerOrEqual(item.bootloader_version, bootloaderVersion)),
    );

export const filterSafeListByFirmware = (
    releasesList: FirmwareRelease[],
    firmwareVersion: VersionArray,
) =>
    releasesList.filter(item =>
        versionUtils.isNewerOrEqual(firmwareVersion, item.min_firmware_version),
    );

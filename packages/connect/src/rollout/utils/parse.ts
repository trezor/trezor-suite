/* eslint-disable camelcase */
import type { Features, StrictFeatures, FirmwareRelease } from '../../types';

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

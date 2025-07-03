import type { DeviceModelInternal, FirmwareRelease } from '@trezor/device-utils';

import { Features, FirmwareType, StrictFeatures, VersionArray } from '../types';

export const isStrictFeatures = (extFeatures: Features): extFeatures is StrictFeatures =>
    [1, 2].includes(extFeatures.major_version) &&
    (extFeatures.firmware_present === false ||
        extFeatures.bootloader_mode == null ||
        extFeatures.bootloader_mode === true);

/**
 * Accepts external releases as published here:
 * https://github.com/trezor/webwallet-data/blob/master/firmware/<model>/releases.json
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

export const buildFirmwareFileName = (
    firmwareType: FirmwareType,
    internalModel: DeviceModelInternal,
    version: VersionArray,
) => {
    const firmwareTypeFileString = firmwareType === FirmwareType.BitcoinOnly ? '-bitcoinonly' : '';

    return `trezor-${internalModel.toLocaleLowerCase()}-${version.join('.')}${firmwareTypeFileString}.bin`;
};

export const buildIntermediaryFirmwareFileName = (
    internalModel: DeviceModelInternal,
    version: number,
) => `trezor-${internalModel}-inter-v${version}.bin`;

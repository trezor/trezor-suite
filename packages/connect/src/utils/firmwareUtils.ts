import type { Features, StrictFeatures } from '@trezor/connect-common/src/types/device';
import type { CurrentVersion, FirmwareChannel } from '@trezor/connect-common/src/types/firmware';
import { FirmwareType } from '@trezor/device-utils';
import type { DeviceModelInternal, FirmwareRelease } from '@trezor/device-utils';
import { versionUtils } from '@trezor/utils';
import type { VersionArray } from '@trezor/utils/src/versionUtils';


export const isStrictFeatures = (extFeatures: Features): extFeatures is StrictFeatures =>
    [1, 2].includes(extFeatures.major_version) &&
    (extFeatures.firmware_present === false ||
        extFeatures.bootloader_mode == null ||
        extFeatures.bootloader_mode === true);

type VersionCheckProperty = 'min_firmware_version' | 'min_bootloader_version';
//  Finds the best compatible firmware release from a data object.
//  It sorts available firmwares from newest to oldest and returns the first one
//  that meets the minimum version requirement for a given device property.
export const findBestCompatibleRelease = (
    availableFirmwares: FirmwareRelease[],
    currentVesion: CurrentVersion,
    checkProperty: VersionCheckProperty,
): FirmwareRelease | undefined => {
    if (!availableFirmwares || availableFirmwares.length === 0) {
        return;
    }

    const currentFirmwareVersion = currentVesion.firmwareVersion;
    const currentBootloaderVersion = currentVesion.bootloaderVersion;

    let versionToCompare = currentFirmwareVersion;

    if (checkProperty === 'min_bootloader_version' && currentBootloaderVersion) {
        versionToCompare = currentBootloaderVersion;
    } else if (checkProperty === 'min_bootloader_version' && currentFirmwareVersion) {
        // If we do not get current bootloader version from Device but ww have current FW version,
        // we can use the current FW version to get the bootloader version based on releases information.
        const currentRelease = availableFirmwares.find(fw =>
            versionUtils.isEqual(currentFirmwareVersion, fw.version),
        );

        if (!currentRelease?.bootloader_version) {
            // Not found bootloader version for this release, or no release was found.
            return;
        }
    }

    if (!versionToCompare) {
        // There is no version to compare.
        return;
    }

    const sortedFirmwares = availableFirmwares.sort((a, b) =>
        versionUtils.isNewer(b.version, a.version) ? 1 : -1,
    );

    const compatibleFirmware = sortedFirmwares.find(fw =>
        versionUtils.isNewerOrEqual(versionToCompare, fw[checkProperty]),
    );

    return compatibleFirmware;
};

const buildLocalFileBaseName = (
    firmwareType: FirmwareType,
    deviceModel: DeviceModelInternal,
    version: VersionArray,
): string => {
    const firmwareSuffix = firmwareType === FirmwareType.BitcoinOnly ? '-bitcoinonly' : '';
    const model = deviceModel.toLowerCase();
    const versionString = version.join('.');

    return `trezor-${model}-${versionString}${firmwareSuffix}`;
};

/**
 * Builds the filename for a local release JSON file.
 * Example: "trezor-t2t1-2.6.0-bitcoinonly.json"
 */
export const buildLocalReleaseName = (
    firmwareType: FirmwareType,
    deviceModel: DeviceModelInternal,
    version: VersionArray,
): string => `${buildLocalFileBaseName(firmwareType, deviceModel, version)}.json`;

/**
 * Builds the filename for a local firmware binary file.
 * Example: "trezor-t2t1-2.6.0.bin"
 */
export const buildLocalFirmwareFileName = (
    firmwareType: FirmwareType,
    deviceModel: DeviceModelInternal,
    version: VersionArray,
): string => `${buildLocalFileBaseName(firmwareType, deviceModel, version)}.bin`;

/**
 * Builds the filename for an intermediary firmware file.
 * Example: "trezor-t2b1-inter-v2.bin"
 */
export const buildIntermediaryFirmwareFileName = (
    internalModel: DeviceModelInternal,
    version: number,
) => `trezor-${internalModel.toLowerCase()}-inter-v${version}.bin`;

export const getFirmwareMode = (features: Features) => {
    if (features.bootloader_mode) return 'bootloader';
    if (!features.initialized) return 'initialize';
    if (features.no_backup) return 'seedless';

    return 'normal';
};

export const getFirmwareType = (features: Features) => {
    let type = FirmwareType.Universal;
    // Vendor headers have been changed in 2.6.3.
    if (features.fw_vendor === 'Trezor Bitcoin-only') {
        type = FirmwareType.BitcoinOnly;
    } else if (features.fw_vendor === 'Trezor') {
        type = FirmwareType.Universal;
    } else if (getFirmwareMode(features) !== 'bootloader') {
        // Relevant for T1B1, T2T1 and custom firmware with a different vendor header. Capabilities do not work in bootloader mode.
        type =
            features.capabilities &&
            features.capabilities.length > 0 &&
            !features.capabilities.includes('Capability_Bitcoin_like')
                ? FirmwareType.BitcoinOnly
                : FirmwareType.Universal;
    } else if (getFirmwareMode(features) === 'bootloader' && features.unit_btconly) {
        // This is a factory reset bitcoin-only device, should be considered bitcoin-only.
        type = FirmwareType.BitcoinOnly;
    }

    return type;
};

export const isFirmwareCacheUsedForSelectedSource = (firmwareChannel?: FirmwareChannel) =>
    firmwareChannel === 'production';

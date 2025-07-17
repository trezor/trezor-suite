import type { DeviceModelInternal, FirmwareRelease } from '@trezor/device-utils';
import { versionUtils } from '@trezor/utils';

import { Features, FirmwareType, StrictFeatures, VersionArray } from '../types';

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
    releasesOfDevice: Record<string, FirmwareRelease>,
    currentDeviceFirmwareVersion: VersionArray,
    checkProperty: VersionCheckProperty,
): FirmwareRelease | undefined => {
    if (!releasesOfDevice || Object.keys(releasesOfDevice).length === 0) {
        return;
    }

    const availableFirmwares = Object.values(releasesOfDevice);
    let versionToCompare = currentDeviceFirmwareVersion;
    if (checkProperty === 'min_bootloader_version') {
        // If the checkPropery is bootloader version we have to check with bootloader version of current firmware version.
        const currentRelease = availableFirmwares.find(fw =>
            versionUtils.isEqual(currentDeviceFirmwareVersion, fw.version),
        );
        if (!currentRelease?.bootloader_version) {
            // Not found bootloader version of this release.
            return;
        }
        versionToCompare = currentRelease?.bootloader_version;
    }

    const sortedFirmwares = availableFirmwares.sort((a, b) =>
        versionUtils.isNewer(b.version, a.version) ? 1 : -1,
    );

    const compatibleFirmware = sortedFirmwares.find(fw =>
        versionUtils.isNewer(versionToCompare, fw[checkProperty]),
    );

    return compatibleFirmware;
};

export const buildLocalFirmwareFileName = (
    firmwareType: FirmwareType,
    deviceModel: DeviceModelInternal,
    version: VersionArray,
) => {
    const firmwareTypeFileString = firmwareType === FirmwareType.BitcoinOnly ? '-bitcoinonly' : '';

    return `trezor-${deviceModel.toLowerCase()}-${version.join('.')}${firmwareTypeFileString}.bin`;
};

export const buildIntermediaryFirmwareFileName = (
    internalModel: DeviceModelInternal,
    version: number,
) => `trezor-${internalModel}-inter-v${version}.bin`;

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

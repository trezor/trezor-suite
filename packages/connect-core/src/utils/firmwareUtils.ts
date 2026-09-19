import type { Features, FirmwareChannel, StrictFeatures } from '@trezor/connect-common';
import { type DeviceModelInternal, FirmwareType } from '@trezor/device-utils';
import { type VersionArray } from '@trezor/utils';

export const isStrictFeatures = (extFeatures: Features): extFeatures is StrictFeatures =>
    [1, 2].includes(extFeatures.major_version) &&
    (extFeatures.firmware_present === false ||
        extFeatures.bootloader_mode == null ||
        extFeatures.bootloader_mode === true);

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

// Vendor headers used by officially signed Trezor firmware.
// Anything else (emulator, locally-signed debug builds, etc.) is considered a debug build.
const PRODUCTION_FIRMWARE_VENDORS = new Set(['Trezor', 'Trezor Bitcoin-only']);

export const isDebugFirmware = (features: Features) =>
    !PRODUCTION_FIRMWARE_VENDORS.has(features.fw_vendor ?? '');

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

// Bundled release JSONs are the production assets, valid only for production-like channels.
export const isProductionFirmwareChannel = (firmwareChannel?: FirmwareChannel) =>
    firmwareChannel === undefined ||
    firmwareChannel === 'production' ||
    firmwareChannel === 'production-early-access';

export const isFirmwareCacheUsedForSelectedSource = (firmwareChannel?: FirmwareChannel) =>
    isProductionFirmwareChannel(firmwareChannel);

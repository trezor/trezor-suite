import type { DeviceModelInternal } from '@trezor/device-utils';

import { Features, FirmwareType, StrictFeatures, VersionArray } from '../types';

export const isStrictFeatures = (extFeatures: Features): extFeatures is StrictFeatures =>
    [1, 2].includes(extFeatures.major_version) &&
    (extFeatures.firmware_present === false ||
        extFeatures.bootloader_mode == null ||
        extFeatures.bootloader_mode === true);

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

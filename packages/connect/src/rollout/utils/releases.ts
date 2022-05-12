import { versionUtils } from '@trezor/utils';
import type { FirmwareRelease, VersionArray } from '../../types';

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

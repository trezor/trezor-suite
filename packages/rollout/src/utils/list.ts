import versionUtils from './version';
import { Release } from '../types';

const filterSafeListByBootloader = ({ releasesList, bootloaderVersion }) =>
    releasesList.filter(
        (item: Release) =>
            (!item.min_bootloader_version ||
                versionUtils.isNewerOrEqual(bootloaderVersion, item.min_bootloader_version)) &&
            (!item.bootloader_version ||
                versionUtils.isNewerOrEqual(item.bootloader_version, bootloaderVersion))
    );

const filterSafeListByFirmware = ({ releasesList, firmwareVersion }) =>
    releasesList.filter(
        (item: Release) =>
            versionUtils.isNewerOrEqual(firmwareVersion, item.min_firmware_version) &&
            versionUtils.isNewer(item.version, firmwareVersion)
    );

export { filterSafeListByBootloader, filterSafeListByFirmware };

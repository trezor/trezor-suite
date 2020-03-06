import versionUtils from './version';
import { ReleaseList, VersionArray } from '../types';

const filterSafeListByBootloader = (releasesList: ReleaseList, bootloaderVersion: VersionArray) => {
    return releasesList.filter((item: ReleaseList[number]) => {
        return (
            (!item.min_bootloader_version ||
                versionUtils.isNewerOrEqual(bootloaderVersion, item.min_bootloader_version)) &&
            (!item.bootloader_version ||
                versionUtils.isNewerOrEqual(item.bootloader_version, bootloaderVersion))
        );
    });
};

const filterSafeListByFirmware = (releasesList: ReleaseList, firmwareVersion: VersionArray) =>
    releasesList.filter((item: ReleaseList[number]) =>
        versionUtils.isNewerOrEqual(firmwareVersion, item.min_firmware_version)
    );

export { filterSafeListByBootloader, filterSafeListByFirmware };

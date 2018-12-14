import versionUtils from 'utils/version';

const filterSafeListByBootloader = ({ releasesList, bootloaderVersion }) => releasesList
    .filter(item => versionUtils.isNewerOrEqual(bootloaderVersion, item.min_bootloader_version)
    && versionUtils.isNewer(item.bootloaderVersion, bootloaderVersion));

const filterSafeListByFirmware = ({ releasesList, firmwareVersion }) => releasesList
    .filter(item => versionUtils.isNewerOrEqual(firmwareVersion, item.min_firmware_version)
    && versionUtils.isNewer(item.version, firmwareVersion));

export {
    filterSafeListByBootloader,
    filterSafeListByFirmware,
};

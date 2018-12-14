import versionUtils from 'utils/version';

const filterSafeListByBootloader = ({ releasesList, bootloaderVersion }) => {
    return releasesList.filter((item) => {
        // item.min_bootloader_version must be lower or equal than actual bootloader_version
        // item.bootloader_version must not be lower or equal than actual bootloader version;
        return versionUtils.isNewerOrEqual(bootloaderVersion, item.min_bootloader_version) && versionUtils.isNewer(item.bootloaderVersion, bootloaderVersion);
    });
};

const filterSafeListByFirmware = ({ releasesList, firmwareVersion }) => {
    return releasesList.filter((item) => {
        // item.min_firmware_version must be lower or equal than actual firmwareVersion
        return versionUtils.isNewerOrEqual(firmwareVersion, item.min_firmware_version) && versionUtils.isNewer(item.version, firmwareVersion);
    });
};

export {
    filterSafeListByBootloader,
    filterSafeListByFirmware,
};

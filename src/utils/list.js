import versionUtils from 'utils/version';

const getSafeBootloaderVersions = (list, bootloaderVersion) => list.filter(item => versionUtils.isNewerOrEqual(bootloaderVersion, item.min_bootloader_version));

const getSafeFirmwareVersions = (list, firmwareVersion) => list.filter(item => versionUtils.isNewerOrEqual(firmwareVersion, item.min_firmware_version));

export {
    getSafeBootloaderVersions,
    getSafeFirmwareVersions,
};

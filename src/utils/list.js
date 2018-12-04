import versionUtils from 'utils/version';

const getVersionOfItem = (list, version) => list.find(item => versionUtils.toString(item.version) === versionUtils.toString(version)).version;

const getSafeBootloaderVersions = (list, bootloaderVersion) => list.filter(item => versionUtils.isNewerOrEqual(bootloaderVersion, item.min_bootloader_version));

const getSafeFirmwareVersions = (list, firmwareVersion) => list.filter(item => versionUtils.isNewerOrEqual(firmwareVersion, item.min_firmware_version));

export {
    getSafeBootloaderVersions,
    getSafeFirmwareVersions,
    getVersionOfItem,
};

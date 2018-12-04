import versionUtils from 'utils/version';

const getVersionOfItem = (list, version) => list.find(item => versionUtils.toString(item.version) === versionUtils.toString(version)).version;

const getSafeBootloaderVersions = (list, bootloaderVersion) => list.filter(item => toString(item.min_bootloader_version) === toString(bootloaderVersion));

const getSafeFirmwareVersions = (list, firmwareVersion) => list.filter(item => toString(item.min_firmware_version) === toString(firmwareVersion));

export {
    getSafeBootloaderVersions,
    getSafeFirmwareVersions,
    getVersionOfItem,
};

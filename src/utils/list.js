import versionUtils from 'utils/version';

const getSafeBlVersions = (list, bootloaderVersion) => list
    .filter(item => versionUtils.isNewer(item.min_bootloader_version, bootloaderVersion));

const getSafeFwVersions = (list, firmwareVersion) => list
    .filter(item => versionUtils.isNewer(item.min_firmware_version, firmwareVersion));

export {
    getSafeBlVersions,
    getSafeFwVersions,
};

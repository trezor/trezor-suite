import versionUtils from 'utils/version';

const getSafeBlVersions = (list, bootloaderVersion) => list
    .filter(item => versionUtils.isNewerOrEqual(bootloaderVersion, item.min_bootloader_version))
    .filter((item) => {
        if (item.bootloader_version) {
            return versionUtils.isNewerOrEqual(item.bootloader_version, bootloaderVersion);
        }
        return null;
    });

const getSafeFwVersions = (list, firmwareVersion) => list
    .filter(item => versionUtils.isNewerOrEqual(firmwareVersion, item.min_firmware_version))
    .filter((item) => {
        if (item.firmwareVersion) {
            return versionUtils.isNewerOrEqual(item.firmware_version, firmwareVersion);
        }
        return null;
    });

const getLastOrEmpty = (list) => {
    if (list.length >= 1) {
        return list[0];
    }
    return [];
};

export {
    getSafeBlVersions,
    getSafeFwVersions,
    getLastOrEmpty,
};

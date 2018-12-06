import { getSafeBootloaderVersions, getSafeFirmwareVersions } from 'utils/list';
import versionUtils from 'utils/version';
import T1_CONSTANTS from 'constants/T1';

const getLatestSafeFw = (input) => {
    const {
        releasesList, isInBootloader, firmwareVersion, bootloaderVersion,
    } = input;

    // no firmware at all - get latest possible
    if (!isInBootloader && !firmwareVersion) {
        return releasesList[0];
    }

    // select newest firmware by bootloader version
    if (isInBootloader) {
        const safeBootloadersList = getSafeBootloaderVersions(releasesList, bootloaderVersion);
        // .filter(item => versionUtils.isNewerOrEqual((item.bootloader_version || T1_CONSTANTS.MIN_BOOTLOADER_VERSION, bootloaderVersion)));

        if (safeBootloadersList.length >= 1) {
            return safeBootloadersList[0];
        }
    }

    // select newest firmware by firmware version
    if (!isInBootloader) {
        const safeFirmwareVersions = getSafeFirmwareVersions(releasesList, firmwareVersion);

        if (safeFirmwareVersions.length >= 1) {
            return safeFirmwareVersions[0];
        }
    }

    return [];
};

const getScore = () => Math.random().toFixed(2);

export {
    getLatestSafeFw,
    getScore,
};

import { getSafeBootloaderVersions, getSafeFirmwareVersions } from 'utils/list';

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
        return safeBootloadersList[0];
    }

    // select newest firmware by firmware version
    if (!isInBootloader) {
        const safeFirmwareVersions = getSafeFirmwareVersions(releasesList, firmwareVersion);
        return safeFirmwareVersions[0];
    }

    return [];
};

const getScore = (userAgent) => {
    const score = 'score';
    return score;
};

export {
    getLatestSafeFw,
    getScore,
};

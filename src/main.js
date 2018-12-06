import { getSafeBlVersions, getSafeFwVersions, getLastOrEmpty } from 'utils/list';

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
        const safeBlVersionsList = getSafeBlVersions(releasesList, bootloaderVersion);
        const result = getLastOrEmpty(safeBlVersionsList);
        return result;
    }

    // select newest firmware by firmware version
    if (!isInBootloader) {
        const safeFwVersionsList = getSafeFwVersions(releasesList, firmwareVersion);
        const result = getLastOrEmpty(safeFwVersionsList);
        return result;
    }

    return [];
};

const getScore = () => Math.random().toFixed(2);

export {
    getLatestSafeFw,
    getScore,
};

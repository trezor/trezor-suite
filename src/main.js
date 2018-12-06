import { getSafeBlVersions, getSafeFwVersions } from 'utils/list';

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
        const filteredList = getSafeBlVersions(releasesList, bootloaderVersion);
        if (filteredList.length > 0) {
            return filteredList[filteredList.length - 1];
        }
        return filteredList;
    }

    // select newest firmware by firmware version
    if (!isInBootloader) {
        const filteredList = getSafeFwVersions(releasesList, firmwareVersion);
        if (filteredList.length > 0) {
            return filteredList[filteredList.length - 1];
        }
        return filteredList;
    }

    return [];
};

const getScore = () => Math.random().toFixed(2);

export {
    getLatestSafeFw,
    getScore,
};

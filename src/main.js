import {
    findNextBootloader,
    findNextFirmware,
    filterBootloader,
    filterFirmware,
} from 'utils/list';

const getLatestSafeFw = (input) => {
    const {
        releasesList, isInBootloader, firmwareVersion, bootloaderVersion,
    } = input;

    // no firmware at all - get latest possible
    if (!isInBootloader && !firmwareVersion) {
        return releasesList[0];
    }

    // select safe firmware by bootloader version
    if (isInBootloader) {
        const next = findNextBootloader(releasesList, bootloaderVersion);
        if (!next) {
            return [];
        }
        console.log('next', next);
        const nextPossibleVersions = filterBootloader(releasesList, next.min_bootloader_version);
        console.log('releasesList', releasesList, 'bootloaderVersion', bootloaderVersion, 'nextPossibleVersions', nextPossibleVersions);
        return nextPossibleVersions[0];
    }

    // select safe firmware by firmware version
    const next = findNextFirmware(releasesList, firmwareVersion);
    if (!next) {
        return [];
    }

    const nextPossibleVersions = filterFirmware(releasesList, next.min_firmware_version);
    return nextPossibleVersions[0];
};

const getScore = () => Math.random().toFixed(2);

export {
    getLatestSafeFw,
    getScore,
};

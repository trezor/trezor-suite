import {
    findNextBootloader,
    findNextFirmware,
    filterBootloader,
    filterFirmware,
} from 'utils/list';

import { getScore, isInProbability } from 'utils/score';

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
        const nextPossibleVersions = filterBootloader(releasesList, next.min_bootloader_version);
        const nextVersion = nextPossibleVersions[0];
        const isBeta = nextVersion.channel === 'beta';

        if (isInProbability(isBeta, nextVersion.rollout, getScore())) {
            return nextVersion;
        }

        return [];
    }

    // select safe firmware by firmware version
    const next = findNextFirmware(releasesList, firmwareVersion);
    if (!next) {
        return [];
    }

    const nextPossibleVersions = filterFirmware(releasesList, next.min_firmware_version);
    const nextVersion = nextPossibleVersions[0];
    const isBeta = nextVersion.channel === 'beta';

    if (isInProbability(isBeta, nextVersion.rollout, getScore())) {
        return nextVersion;
    }

    return [];
};

export {
    getLatestSafeFw,
    getScore,
};

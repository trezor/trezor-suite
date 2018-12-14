import { filterSafeListByFirmware, filterSafeListByBootloader } from 'utils/list';
import { getScore, isInProbability } from 'utils/score';
import versionUtils from 'utils/version';

const getBootloaderVersion = ({
    releasesList, isInBootloader, firmwareVersion, bootloaderVersion,
}) => {
    if (isInBootloader) {
        return bootloaderVersion;
    }
    const foundVersion = releasesList.find(item => versionUtils.isEqual(item.version, firmwareVersion));
    if (!foundVersion || !foundVersion.bootloaderVersion) {
        return null;
    }
    return foundVersion.bootloaderVersion;
};

const getLatestSafeFw = (input, score) => {
    // first find bootloader version for both bootloader mode and normal mode;
    const {
        isInBootloader, firmwareVersion, firmwarePresent,
    } = input;
    let { releasesList } = input;

    const latest = releasesList[0];
    let isNewer;
    if (isInBootloader) {
        // here we can not guarantee, that offered firmware is really newer than actual
        // because we are evaluating bootloader versions, which do not automatically
        // increment between firmware releases
        const bootloaderVersion = getBootloaderVersion(input);
        releasesList = filterSafeListByBootloader({ releasesList, bootloaderVersion });
        if (releasesList[0] && versionUtils.isNewer(releasesList[0].bootloaderVersion, bootloaderVersion)) {
            isNewer = true;
        } else {
            isNewer = null;
        }
    } else {
        releasesList = filterSafeListByFirmware({ releasesList, firmwareVersion });
        const bootloaderVersion = getBootloaderVersion(input);
        if (bootloaderVersion) {
            releasesList = filterSafeListByBootloader({ releasesList, bootloaderVersion });
        }
        isNewer = true;
    }

    if (!releasesList.length) {
        // no new firmware
        return null;
    }

    // no firmware at all - get latest possible
    if (firmwarePresent === false) {
        return {
            firmware: releasesList[0],
            isLatest: versionUtils.isEqual(releasesList[0].version, latest.version),
            isRequired: true,
            isNewer: true,
        };
    }

    if (score) {
        if (isInProbability(releasesList[0].rollout, score)) {
            return {
                firmware: releasesList[0],
                isLatest: versionUtils.isEqual(releasesList[0].version, latest.version),
                isRequired: releasesList.some(item => item.required),
                isNewer,
            };
        }
        return null;
    }
    return {
        firmware: releasesList[0],
        isLatest: versionUtils.isEqual(releasesList[0].version, latest.version),
        isRequired: releasesList.some(item => item.required),
        isNewer,
    };
};

export {
    getLatestSafeFw,
    getScore,
    getBootloaderVersion,
};

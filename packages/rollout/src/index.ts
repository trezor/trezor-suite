import {
    filterSafeListByFirmware,
    filterSafeListByBootloader,
    findActualBlVersionInList,
} from './utils/list';
import { fetchFirmware, fetchReleasesList } from './utils/fetch';
import { getScore, isInProbability } from './utils/score';
import versionUtils from './utils/version';
import { Release, RolloutOpts, Firmware, Features } from './types';

const rollout = (opts: RolloutOpts) => {
    const { releasesListsPaths, baseUrl } = opts;
    const releasesList = {
        1: [],
        2: [],
    };

    const modifyFirmware = ({ fw, features }: { fw: Firmware; features: Features }) => {
        const deviceBlVersion = findActualBlVersionInList(releasesList[features.major_version], [
            features.major_version,
            features.minor_version,
            features.patch_version,
        ]);
        if (!deviceBlVersion) {
            // this should be safe, in releasesList, bootloader_version is not defined for some ancient firmwares.
            // at the same time, there is no need to modify them, so just return the fw.
            return fw;
        }

        // ---------------------
        // Model T modifications
        // ---------------------
        // there are currently none.
        if (features.major_version === 2) return fw;

        // -----------------------
        // Model One modifications
        // -----------------------

        // any version installed on bootloader 1.8.0 must be sliced of the first 256 bytes (containing old firmware header)
        // unluckily, we dont know the actual bootloader of connected device, but we can assume it is 1.8.0 in case
        // getInfo() returns firmware with version 1.8.1 or greater as it has bootloader version 1.8.0 (see releases.ts)
        // this should be temporary until special bootloader updating firmwares are ready
        if (versionUtils.isNewerOrEqual(deviceBlVersion, [1, 8, 0])) {
            return fw.slice(256);
        }
        return fw;
    };

    const getInfoCommon = (features, list, score) => {
        const {
            bootloader_mode,
            major_version,
            minor_version,
            patch_version,
            firmware_present,
        } = features;
        let isNewer: boolean | null;
        const latest = list[0];
        if (bootloader_mode) {
            list = filterSafeListByBootloader(list, [major_version, minor_version, patch_version]);
            if (!list.length) {
                return null;
            }
            // no firmware at all - get latest possible
            if (firmware_present === false) {
                return {
                    firmware: list[0],
                    isLatest: versionUtils.isEqual(list[0].version, latest.version),
                    isRequired: true,
                };
            }
        } else {
            list = filterSafeListByFirmware(list, [major_version, minor_version, patch_version]);
        }
        if (!list.length) {
            // no new firmware
            return null;
        }
        if (score != null && !Number.isNaN(score)) {
            list = list.filter(item => isInProbability(item.rollout, score));
        }
        if (!list.length) {
            // no new firmware
            return null;
        }
        if (bootloader_mode) {
            isNewer = null;
        } else {
            isNewer = versionUtils.isNewer(list[0].version, [
                major_version,
                minor_version,
                patch_version,
            ]);
        }
        return {
            firmware: list[0],
            isLatest: versionUtils.isEqual(list[0].version, latest.version),
            isRequired: list.some(item => item.required),
            isNewer,
        };
    };

    const getInfo = async (features: Features, score?: number) => {
        const model = features.major_version;
        if (!releasesList[model].length) {
            releasesList[model] = await fetchReleasesList(
                `${baseUrl}/${releasesListsPaths[model]}`
            );
        }
        return getInfoCommon(features, releasesList[model], score);
    };

    const getInfoSync = (features, list: Release[], score?: number) => {
        return getInfoCommon(features, list, score);
    };

    const getFw = async (features: Features, score?: number) => {
        const info = await getInfo(features, score);
        if (!info) {
            return null;
        }
        const fw = await fetchFirmware(`${baseUrl}/${info.firmware.url}`);
        return modifyFirmware({ fw, features });
    };

    return {
        getFw,
        getInfo,
        getInfoSync,
    };
};

export default rollout;

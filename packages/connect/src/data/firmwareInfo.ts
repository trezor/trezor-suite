/* eslint-disable camelcase */
// origin: https://github.com/trezor/connect/blob/develop/src/js/data/FirmwareInfo.js

import { versionUtils } from '@trezor/utils';
import {
    filterSafeListByFirmware,
    filterSafeListByBootloader,
    getScore,
    isStrictFeatures,
    isValidReleases,
} from '../utils/firmwareUtils';
import type { Features, StrictFeatures, FirmwareRelease, ReleaseInfo } from '../types';

const releases: { [key: number]: FirmwareRelease[] } = {};
releases[1] = [];
releases[2] = [];

export const parseFirmware = (json: any, model: number) => {
    Object.keys(json).forEach(key => {
        const release = json[key];
        releases[model].push({
            ...release,
        });
    });
};

const getChangelog = (releases: FirmwareRelease[], features: StrictFeatures) => {
    // releases are already filtered, so they can be considered "safe".
    // so lets build changelog! It should include only those firmwares, that are
    // newer than currently installed firmware.

    if (features.bootloader_mode) {
        // the problem with bootloader is that we see only bootloader and not firmware version
        // and multiple releases may share same bootloader version. we really can not tell that
        // the versions that are installable are newer. so...
        if (features.firmware_present && features.major_version === 1) {
            // return null signaling that we don't really know, but only if some firmware
            // is already installed!
            return null;
        }
        if (features.firmware_present && features.major_version === 2) {
            // little different situation is with model 2, where in bootloader (and with some fw installed)
            // we actually know the firmware version
            return releases.filter(r =>
                versionUtils.isNewer(r.version, [
                    features.fw_major,
                    features.fw_minor,
                    features.fw_patch,
                ]),
            );
        }
        // for fresh devices, we can assume that all releases are actually "new"
        return releases;
    }

    // otherwise we are in firmware mode and because each release in releases list has
    // version higher than the previous one, we can filter out the version that is already
    // installed and show only what's new!
    return releases.filter(r =>
        versionUtils.isNewer(r.version, [
            features.major_version,
            features.minor_version,
            features.patch_version,
        ]),
    );
};

const isNewer = (release: FirmwareRelease, features: StrictFeatures) => {
    if (features.major_version === 1 && features.bootloader_mode) {
        return null;
    }
    return versionUtils.isNewer(release.version, [
        features.major_version,
        features.minor_version,
        features.patch_version,
    ]);
};

const isRequired = (changelog: ReturnType<typeof getChangelog>) => {
    if (!changelog || !changelog.length) return null;
    return changelog.some(item => item.required);
};

const isEqual = (release: FirmwareRelease, latest: FirmwareRelease) =>
    versionUtils.isEqual(release.version, latest.version);

export interface GetInfoProps {
    features: Features;
    releases: FirmwareRelease[];
}

/**
 * Get info about available firmware update
 * @param features
 * @param releases
 */
export const getInfo = ({ features, releases }: GetInfoProps): ReleaseInfo | null => {
    if (!isStrictFeatures(features)) {
        throw new Error('Features of unexpected shape provided.');
    }
    if (!isValidReleases(releases)) {
        throw new Error(`Release object in unexpected shape.`);
    }
    let parsedReleases = releases;

    let score = 0; // just because of ts

    /* istanbul ignore next */
    if (features.device_id) {
        score = getScore(features.device_id);
    }
    const {
        bootloader_mode,
        major_version,
        minor_version,
        patch_version,
        fw_major,
        fw_minor,
        fw_patch,
    } = features;

    if (score) {
        parsedReleases = parsedReleases.filter(item => {
            if (!item.rollout) return true;
            return item.rollout >= score;
        });
    }

    const latest = parsedReleases[0];

    if (major_version === 2 && bootloader_mode) {
        // sorry for this if, I did not figure out how to narrow types properly
        if (fw_major !== null && fw_minor !== null && fw_patch !== null) {
            // in bootloader, model T knows its firmware, so we still may filter "by firmware".
            parsedReleases = filterSafeListByFirmware(parsedReleases, [
                fw_major,
                fw_minor,
                fw_patch,
            ]);
        }
        parsedReleases = filterSafeListByBootloader(parsedReleases, [
            major_version,
            minor_version,
            patch_version,
        ]);
    } else if (major_version === 1 && bootloader_mode) {
        // model one does not know its firmware, we need to filter by bootloader. this has the consequence
        // that we do not know if the version we find in the end is newer than the actual installed version
        parsedReleases = filterSafeListByBootloader(parsedReleases, [
            major_version,
            minor_version,
            patch_version,
        ]);
    } else {
        // in other cases (not in bootloader) we may filter by firmware
        parsedReleases = filterSafeListByFirmware(parsedReleases, [
            major_version,
            minor_version,
            patch_version,
        ]);
    }

    if (!parsedReleases.length) {
        // no new firmware
        return null;
    }

    const isLatest = isEqual(parsedReleases[0], latest);
    const changelog = getChangelog(parsedReleases, features);

    return {
        changelog,
        release: parsedReleases[0],
        isLatest,
        latest,
        isRequired: isRequired(changelog),
        isNewer: isNewer(parsedReleases[0], features),
    };
};

export const getFirmwareStatus = (features: Features) => {
    // indication that firmware is not installed at all. This information is set to false in bl mode. Otherwise it is null.
    if (features.firmware_present === false) {
        return 'none';
    }
    // for t1 in bootloader, what device reports as firmware version is in fact bootloader version, so we can
    // not safely tell firmware version
    if (features.major_version === 1 && features.bootloader_mode) {
        return 'unknown';
    }

    const info = getInfo({ features, releases: releases[features.major_version] });

    // should not happen, possibly if releases list contains inconsistent data or so
    if (!info) return 'unknown';

    if (info.isRequired) return 'required';

    if (info.isNewer) return 'outdated';

    return 'valid';
};

export const getRelease = (features: Features) =>
    getInfo({ features, releases: releases[features.major_version] });

export const getReleases = (model: number) => releases[model];

// origin: https://github.com/trezor/connect/blob/develop/src/js/data/FirmwareInfo.js

import { versionUtils } from '@trezor/utils';
import {
    filterSafeListByFirmware,
    filterSafeListByBootloader,
    isStrictFeatures,
    isValidReleases,
} from '../utils/firmwareUtils';
import type {
    Features,
    StrictFeatures,
    FirmwareRelease,
    ReleaseInfo,
    VersionArray,
    IntermediaryVersion,
} from '../types';
import { DeviceModelInternal } from '../types';

const releases: Record<keyof typeof DeviceModelInternal, FirmwareRelease[]> = {
    [DeviceModelInternal.T1B1]: [],
    [DeviceModelInternal.T2T1]: [],
    [DeviceModelInternal.T2B1]: [],
};

export const parseFirmware = (json: any, deviceModel: DeviceModelInternal) => {
    Object.keys(json).forEach(key => {
        const release = json[key];
        releases[deviceModel].push({
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

const getT1BootloaderVersion = (
    releases: FirmwareRelease[],
    features: StrictFeatures,
): VersionArray => {
    const { bootloader_mode, major_version, minor_version, patch_version } = features;
    const versionArray = [major_version, minor_version, patch_version] as VersionArray;

    if (bootloader_mode) {
        return versionArray;
    }

    const release = releases.find(({ version }) => versionUtils.isEqual(version, versionArray));

    /**
     * FW version 1.6.0 and below don't have bootloader_version listed, so default to 1.0.0,
     * because it doesn't matter for intermediary version calculation.
     */
    return release?.bootloader_version || [1, 0, 0];
};

/**
 * v1 - bootloader < 1.8.0
 * v2 - bootloader >= 1.8.0, < 1.12.0
 * v3 - bootloader >= 1.12.0
 */
const getIntermediaryVersion = (
    releases: FirmwareRelease[],
    features: StrictFeatures,
    offerLatest: boolean,
): IntermediaryVersion | undefined => {
    if (features.major_version !== 1 || offerLatest) {
        // Intermediary is only supported on T1B1 and not needed if latest firmware is already offered
        return;
    }

    const bootloaderVersion = getT1BootloaderVersion(releases, features);

    if (versionUtils.isNewerOrEqual(bootloaderVersion, [1, 12, 0])) {
        return 3;
    }

    if (versionUtils.isNewerOrEqual(bootloaderVersion, [1, 8, 0])) {
        return 2;
    }

    return 1;
};

export interface GetInfoProps {
    features: Features;
    releases: FirmwareRelease[];
}

const getSafeReleases = ({ features, releases }: GetInfoProps) => {
    const {
        bootloader_mode,
        major_version,
        minor_version,
        patch_version,
        fw_major,
        fw_minor,
        fw_patch,
    } = features;

    const firmwareVersion = [major_version, minor_version, patch_version];

    if (!versionUtils.isVersionArray(firmwareVersion)) {
        return [];
    }

    if (major_version === 2 && bootloader_mode) {
        const fwVersion = [fw_major, fw_minor, fw_patch];
        if (versionUtils.isVersionArray(fwVersion)) {
            // in bootloader, T2T1, T2B1 knows its firmware, so we still may filter "by firmware".
            return filterSafeListByFirmware(releases, fwVersion);
        }
        return filterSafeListByBootloader(releases, firmwareVersion);
    }
    if (major_version === 1 && bootloader_mode) {
        // T1B1 does not know its firmware, we need to filter by bootloader. this has the consequence
        // that we do not know if the version we find in the end is newer than the actual installed version
        return filterSafeListByBootloader(releases, firmwareVersion);
    }

    // in other cases (not in bootloader) we may filter by firmware
    return filterSafeListByFirmware(releases, firmwareVersion);
};

/**
 * Get info about available firmware update.
 * For T1B1, it always returns the latest firmware plus intermediaryVersion
 * needed to get to the latest if it's not availabe for direct install.
 * @param features
 * @param releases
 */
export const getInfo = ({ features, releases }: GetInfoProps): ReleaseInfo | null => {
    if (!Array.isArray(releases)) {
        // no available releases - should never happen for official firmware, only custom
        return null;
    }
    if (!isStrictFeatures(features)) {
        throw new Error('Features of unexpected shape provided.');
    }
    if (!isValidReleases(releases)) {
        throw new Error(`Release object in unexpected shape.`);
    }

    const latest = releases[0];

    const releasesSafe = getSafeReleases({ features, releases });

    if (!releasesSafe.length) {
        // no available firmware - should never happen for official firmware, only custom
        return null;
    }

    /**
     * For T1B1 we always support installation of latest firmware, possibly using an intermediary.
     * For T2T1 there is only "incremental FW update" if it's not possible to install latest right away.
     */
    const releasesParsed = features.major_version === 1 ? releases : releasesSafe;

    const changelog = getChangelog(releasesParsed, features);

    const release = releasesParsed[0];

    const intermediaryVersion = getIntermediaryVersion(
        releases,
        features,
        isEqual(releasesSafe[0], latest),
    );

    return {
        changelog,
        release,
        isRequired: isRequired(changelog),
        isNewer: isNewer(latest, features), // do not consider safe releases, we want to show "outdated" even if it's not safe to update
        intermediaryVersion,
    };
};

export const getFirmwareStatus = (features: Features) => {
    // indication that firmware is not installed at all. This information is set to false in bl mode. Otherwise it is null.
    if (features.firmware_present === false) {
        return 'none';
    }
    // for T1B1 in bootloader, what device reports as firmware version is in fact bootloader version, so we can
    // not safely tell firmware version
    if (features.major_version === 1 && features.bootloader_mode) {
        return 'unknown';
    }

    const info = getInfo({
        features,
        releases: releases[features?.internal_model],
    });

    // should never happen for official firmware, see getInfo
    if (!info) return 'custom';

    if (info.isRequired) return 'required';

    if (info.isNewer) return 'outdated';

    return 'valid';
};

export const getRelease = (features: Features) =>
    getInfo({
        features,
        releases: releases[features?.internal_model],
    });

export const getReleases = (deviceModel: DeviceModelInternal) => releases[deviceModel];

import { filterSafeListByFirmware, filterSafeListByBootloader } from './utils/releases';
import { fetchFirmware } from './utils/fetch';
import { getScore } from './utils/score';
import * as versionUtils from './utils/version';
import { parseFeatures, parseReleases, Release, Features } from './utils/parse';

type ParsedFeatures = ReturnType<typeof parseFeatures>;

/**
 * Returns firmware binary after necessary modifications. Should be ok to install.
 */
const modifyFirmware = ({
    fw,
    features,
    releases,
}: {
    fw: ArrayBuffer;
    features: ParsedFeatures;
    releases: Release[];
}) => {
    // ---------------------
    // Model T modifications
    // ---------------------
    // there are currently none.
    if (features.major_version === 2) return fw;

    // -----------------------
    // Model One modifications
    // -----------------------

    // any version installed on bootloader 1.8.0 must be sliced of the first 256 bytes (containing old firmware header)
    // unluckily, we don't know the actual bootloader of connected device, but we can assume it is 1.8.0 in case
    // getInfo() returns firmware with version 1.8.1 or greater as it has bootloader version 1.8.0 (see releases.json)
    // this should be temporary until special bootloader updating firmware are ready
    if (
        versionUtils.isNewerOrEqual(
            [features.major_version, features.minor_version, features.patch_version],
            [1, 8, 0]
        )
    ) {
        return fw.slice(256);
    }
    return fw;
};

const getChangelog = (releases: Release[], features: ParsedFeatures) => {
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
                ])
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
        ])
    );
};

const isNewer = (release: Release, features: ParsedFeatures) => {
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

const isLatest = (release: Release, latest: Release) => {
    return versionUtils.isEqual(release.version, latest.version);
};

interface GetInfoProps {
    features: Features;
    releases: Release[];
}

/**
 * Get info about available firmware update
 * @param features
 * @param releases
 */
export const getInfo = ({ features, releases }: GetInfoProps) => {
    const parsedFeatures = parseFeatures(features);
    let parsedReleases = parseReleases(releases);

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
    } = parsedFeatures;
    const latest = parsedReleases[0];

    if (score) {
        parsedReleases = parsedReleases.filter(item => {
            if (!item.rollout) return true;
            return item.rollout >= score;
        });
    }

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

    const changelog = getChangelog(parsedReleases, parsedFeatures);

    return {
        changelog,
        release: parsedReleases[0],
        isLatest: isLatest(parsedReleases[0], latest),
        isRequired: isRequired(changelog),
        isNewer: isNewer(parsedReleases[0], parsedFeatures),
    };
};

interface GetBinaryProps extends GetInfoProps {
    baseUrl: string;
    baseUrlBeta: string;
    btcOnly?: boolean;
    version: Release['version'];
}

/**
 * Accepts version of firmware that is to be installed.
 * Also accepts features and releases list in order to validate that the provided version
 * is safe.
 * Ignores rollout (score)
 */
export const getBinary = async ({
    features,
    releases,
    baseUrl,
    baseUrlBeta,
    version,
    btcOnly,
}: GetBinaryProps) => {
    // we get info here again, but only as a sanity check.
    const releaseByFirmware = releases.find(r => versionUtils.isEqual(r.version, version));
    const infoByBootloader = getInfo({ features, releases });

    const parsedFeatures = parseFeatures(features);
    const parsedReleases = parseReleases(releases);

    if (!infoByBootloader || !releaseByFirmware) {
        throw new Error('no firmware found for this device');
    }

    if (btcOnly && !releaseByFirmware.url_bitcoinonly) {
        throw new Error(`firmware version ${version} does not exist in btc only variant`);
    }

    // it is better to be defensive and not allow user update rather than let him wipe his seed
    // in case of improper update
    if (!versionUtils.isEqual(releaseByFirmware.version, infoByBootloader.release.version)) {
        throw new Error(
            'version provided as param does not match firmware version found by features in bootloader'
        );
    }

    const url = releaseByFirmware.channel === 'beta' ? baseUrlBeta : baseUrl;
    const fw = await fetchFirmware(
        `${url}/${btcOnly ? releaseByFirmware.url_bitcoinonly : releaseByFirmware.url}`
    );
    return {
        ...infoByBootloader,
        binary: modifyFirmware({ fw, features: parsedFeatures, releases: parsedReleases }),
    };
};

export type FirmwareRelease = ReturnType<typeof getInfo>;
export type FirmwareBinary = ReturnType<typeof getBinary>;

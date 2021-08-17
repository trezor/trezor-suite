/* eslint-disable camelcase */
import { filterSafeListByFirmware, filterSafeListByBootloader } from './utils/releases';
import { fetchFirmware } from './utils/fetch';
import { getScore } from './utils/score';
import * as versionUtils from './utils/version';
import { parseFeatures, parseReleases, Release, Features } from './utils/parse';

type ParsedFeatures = ReturnType<typeof parseFeatures>;

/**
 * Returns firmware binary after necessary modifications. Should be ok to install.
 */
export const modifyFirmware = ({ fw, features }: { fw: ArrayBuffer; features: ParsedFeatures }) => {
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
        const fwView = new Uint8Array(fw);
        // this condition was added in order to upload firmware process being equivalent as in trezorlib python code
        if (
            String.fromCharCode(...Array.from(fwView.slice(0, 4))) === 'TRZR' &&
            String.fromCharCode(...Array.from(fwView.slice(256, 260))) === 'TRZF'
        ) {
            return fw.slice(256);
        }
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

const isEqual = (release: Release, latest: Release) =>
    versionUtils.isEqual(release.version, latest.version);

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
    const changelog = getChangelog(parsedReleases, parsedFeatures);

    return {
        changelog,
        release: parsedReleases[0],
        isLatest,
        latest,
        isRequired: isRequired(changelog),
        isNewer: isNewer(parsedReleases[0], parsedFeatures),
    };
};

interface GetBinaryProps extends GetInfoProps {
    baseUrl: string;
    btcOnly?: boolean;
    version?: Release['version'];
    intermediary?: boolean;
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
    version,
    btcOnly,
    intermediary = false,
}: GetBinaryProps) => {
    const parsedFeatures = parseFeatures(features);

    if (intermediary && parsedFeatures.major_version !== 2) {
        const fw = await fetchFirmware(`${baseUrl}/firmware/1/trezor-inter-1.10.0.bin`);
        return { binary: modifyFirmware({ fw, features: parsedFeatures }) };
    }

    // we get info here again, but only as a sanity check.
    const infoByBootloader = getInfo({ features, releases });
    const releaseByFirmware = releases.find(r => versionUtils.isEqual(r.version, version!));

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
    const fw = await fetchFirmware(
        `${baseUrl}/${btcOnly ? releaseByFirmware.url_bitcoinonly : releaseByFirmware.url}`
    );
    return {
        ...infoByBootloader,
        binary: modifyFirmware({ fw, features: parsedFeatures }),
    };
};

export type FirmwareRelease = ReturnType<typeof getInfo>;
export type FirmwareBinary = ReturnType<typeof getBinary>;

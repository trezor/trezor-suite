/* eslint-disable camelcase */

import { createHash } from 'crypto';
import { versionUtils } from '@trezor/utils';

import { fetchFirmware } from '../utils/fetch';

// todo: duplicated with trezor-connect
type Release = {
    required: true;
    version: [number, number, number];
    min_bridge_version: [number, number, number];
    min_firmware_version: [number, number, number];
    bootloader_version: [number, number, number];
    min_bootloader_version: [number, number, number];
    url: string;
    url_bitcoinonly?: string;
    fingerprint: string;
    changelog: string;
    channel?: string;
    rollout?: number;
};

// todo: duplicated with trezor-connect
export type FirmwareRelease = {
    changelog: Release[] | null;
    release: Release;
    isLatest: boolean | null;
    isRequired: boolean | null;
    isNewer: boolean | null;
};

// todo: local features only for this file
// todo: remove later. protobuf.d.ts is not yet part of monorepo
type Features = {
    vendor: string;
    major_version: number;
    minor_version: number;
    patch_version: number;
    bootloader_mode: boolean | null;
    device_id: string | null;
    pin_protection: boolean | null;
    passphrase_protection: boolean | null;
    language: string | null;
    label: string | null;
    initialized: boolean | null;
    revision: string | null;
    bootloader_hash: string | null;
    imported: boolean | null;
    unlocked: boolean | null;
    _passphrase_cached?: boolean;
    firmware_present: boolean | null;
    needs_backup: boolean | null;
    flags: number | null;
    model: string;
    fw_major: number | null;
    fw_minor: number | null;
    fw_patch: number | null;
    fw_vendor: string | null;
    unfinished_backup: boolean | null;
    no_backup: boolean | null;
    recovery_mode: boolean | null;
    sd_card_present: boolean | null;
    sd_protection: boolean | null;
    wipe_code_protection: boolean | null;
    session_id: string | null;
    passphrase_always_on_device: boolean | null;
    auto_lock_delay_ms: number | null;
    display_rotation: number | null;
    experimental_features: boolean | null;
};

type VersionArray = [number, number, number];

const releases: { [key: number]: FirmwareRelease[] } = {};
releases[1] = [];
releases[2] = [];

const getScore = (device_id: string) => {
    const hash = createHash('sha256');
    hash.update(device_id);
    const output = parseInt(hash.digest('hex'), 16) / 2 ** 256;
    return Math.round(output * 100) / 100;
};

const filterSafeListByBootloader = (releasesList: Release[], bootloaderVersion: VersionArray) =>
    releasesList.filter(
        item =>
            (!item.min_bootloader_version ||
                versionUtils.isNewerOrEqual(bootloaderVersion, item.min_bootloader_version)) &&
            (!item.bootloader_version ||
                versionUtils.isNewerOrEqual(item.bootloader_version, bootloaderVersion)),
    );

const filterSafeListByFirmware = (releasesList: Release[], firmwareVersion: VersionArray) =>
    releasesList.filter(item =>
        versionUtils.isNewerOrEqual(firmwareVersion, item.min_firmware_version),
    );

/**
 * Returns firmware binary after necessary modifications. Should be ok to install.
 */
export const modifyFirmware = ({ fw, features }: { fw: ArrayBuffer; features: Features }) => {
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
            [1, 8, 0],
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

const getChangelog = (releases: Release[], features: Features) => {
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
                    features.fw_major!, // not null for model 2 non in bl
                    features.fw_minor!, // not null for model 2 non in bl
                    features.fw_patch!, // not null for model 2 non in bl
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

const isNewer = (release: Release, features: Features) => {
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
const getInfo = ({ features, releases }: GetInfoProps) => {
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
        releases = releases.filter(item => {
            if (!item.rollout) return true;
            return item.rollout >= score;
        });
    }

    const latest = releases[0];

    if (major_version === 2 && bootloader_mode) {
        // sorry for this if, I did not figure out how to narrow types properly
        if (fw_major !== null && fw_minor !== null && fw_patch !== null) {
            // in bootloader, model T knows its firmware, so we still may filter "by firmware".
            releases = filterSafeListByFirmware(releases, [fw_major, fw_minor, fw_patch]);
        }
        releases = filterSafeListByBootloader(releases, [
            major_version,
            minor_version,
            patch_version,
        ]);
    } else if (major_version === 1 && bootloader_mode) {
        // model one does not know its firmware, we need to filter by bootloader. this has the consequence
        // that we do not know if the version we find in the end is newer than the actual installed version
        releases = filterSafeListByBootloader(releases, [
            major_version,
            minor_version,
            patch_version,
        ]);
    } else {
        // in other cases (not in bootloader) we may filter by firmware
        releases = filterSafeListByFirmware(releases, [
            major_version,
            minor_version,
            patch_version,
        ]);
    }

    if (!releases.length) {
        // no new firmware
        return null;
    }

    const isLatest = isEqual(releases[0], latest);
    const changelog = getChangelog(releases, features);

    return {
        changelog,
        release: releases[0],
        isLatest,
        latest,
        isRequired: isRequired(changelog),
        isNewer: isNewer(releases[0], features),
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
    // todo: rename
    const parsedFeatures = features;

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
            'version provided as param does not match firmware version found by features in bootloader',
        );
    }
    const fw = await fetchFirmware(
        `${baseUrl}/${btcOnly ? releaseByFirmware.url_bitcoinonly : releaseByFirmware.url}`,
    );
    return {
        ...infoByBootloader,
        binary: modifyFirmware({ fw, features: parsedFeatures }),
    };
};

// strip "data" directory from download url (default: data.trezor.io)
// it's hard coded in "releases.json" ("mytrezor" dir structure)
const cleanUrl = (url?: string) => {
    if (typeof url !== 'string') return;
    if (url.indexOf('data/') === 0) return url.substring(5);
    return url;
};

export const parseFirmware = (json: any, model: number) => {
    Object.keys(json).forEach(key => {
        const release = json[key];
        releases[model].push({
            ...release,
            url: cleanUrl(release.url),
            url_bitcoinonly: cleanUrl(release.url_bitcoinonly),
        });
    });
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

    // todo: there is releases type in @trezor/rollout which is not compatible with releases here
    // @trezor/rollout should be removed/merged into connect-* packages, so I am skipping type-check for now
    // @ts-ignore
    const info = getInfo({ features, releases: releases[features.major_version] });

    // should not happen, possibly if releases list contains inconsistent data or so
    if (!info) return 'unknown';

    if (info.isRequired) return 'required';

    if (info.isNewer) return 'outdated';

    return 'valid';
};

export const getRelease = (features: Features) =>
    // for t1 in bootloader, what device reports as firmware version is in fact bootloader version, so we can
    // not safely tell firmware version
    // @ts-ignore
    getInfo({ features, releases: releases[features.major_version] });

export const getReleases = (model: number) => releases[model];

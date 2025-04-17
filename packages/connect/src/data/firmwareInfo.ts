// origin: https://github.com/trezor/connect/blob/develop/src/js/data/FirmwareInfo.js
import { DeviceModelInternal, FirmwareType, VersionArray } from '@trezor/device-utils';
import { versionUtils } from '@trezor/utils';

import { getReleasesMessage } from '@trezor/connect-message-releases';
import type {
    ConditionalRelease,
    IntermediaryRelease,
    ReleaseMessage,
} from '@trezor/connect-message-releases/src/types';

import type {
    Features,
    FirmwareRelease,
    ReleaseInfo,
    ReleaseMessageInfo,
    StrictFeatures,
} from '../types';
import {
    buildFirmwareFileName,
    buildIntermediaryFirmwareFileName,
    filterSafeListByBootloader,
    filterSafeListByFirmware,
    isStrictFeatures,
    isValidMessageRelease,
    isValidReleases,
} from '../utils/firmwareUtils';
import { DataManager } from './DataManager';

// undefined releases should never happen for official firmware, only custom
const releases = Object.values(DeviceModelInternal).reduce(
    (acc, key) => ({ ...acc, [key]: [] }),
    {} as Record<keyof typeof DeviceModelInternal, FirmwareRelease[] | undefined>,
);

let messageReleases: ReleaseMessage['releases'] | undefined;
let messageIntermediaryReleases:
    | Record<keyof typeof DeviceModelInternal, IntermediaryRelease[]>
    | undefined;
let bundledReleases: Record<keyof typeof DeviceModelInternal, FirmwareRelease> = {} as Record<
    keyof typeof DeviceModelInternal,
    FirmwareRelease
>;

export const parseFirmwareReleases = (
    modelReleases: FirmwareRelease[],
    deviceModel: DeviceModelInternal,
) => {
    if (!Array.isArray(modelReleases)) {
        return;
    }
    const [latestRelease] = modelReleases;
    bundledReleases[deviceModel] = latestRelease;
    modelReleases.forEach(release => {
        releases[deviceModel]?.push({
            ...release,
        });
    });
};

export const getReleases = (deviceModel: DeviceModelInternal) => releases[deviceModel] || [];

export const parseMessageRelease = async (): Promise<any> => {
    try {
        const message = await getReleasesMessage();
        if (!message) {
            throw new Error('Missing message release.');
        }
        messageReleases = message.releases;
        messageIntermediaryReleases = message.intermediaries;
        return {
            releases,
            intermediaryReleases: messageIntermediaryReleases,
        };
    } catch (error) {
        throw new Error(`Error parsing message release ${error}`);
    }
};

const getIntermediaryMessageRelease = (
    deviceModel: DeviceModelInternal,
    firmwareVersion: VersionArray,
) => {
    if (!messageIntermediaryReleases) {
        throw new Error('Message releases not loaded.');
    }

    const deviceIntermediaryReleases = messageIntermediaryReleases[deviceModel];
    if (!deviceIntermediaryReleases) {
        // There are not intermediary releases for this model.
        return undefined;
    }

    const intermediary = deviceIntermediaryReleases.find(inter => {
        console.log('inter intermediary', inter);
        console.log('firmwareVersion', firmwareVersion);
        return versionUtils.isNewer(inter.if_version_less_than, firmwareVersion);
    });

    return intermediary || undefined; // Return null if no intermediary is found
};

export const getMessageRelease = (deviceModel: DeviceModelInternal, firmwareType: FirmwareType) => {
    if (!messageReleases) {
        throw new Error('Message releases not loaded.');
    }
    const deviceMessageRelease = messageReleases[deviceModel];
    if (!deviceMessageRelease) {
        throw new Error(`No message release found for device model ${deviceModel}`);
    }
    const message = deviceMessageRelease.find(item => item.firmware_type === firmwareType);
    return message;
};

const getChangelog = (releases2: FirmwareRelease[], features: StrictFeatures) => {
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
            return releases2.filter(r =>
                versionUtils.isNewer(r.version, [
                    features.fw_major,
                    features.fw_minor,
                    features.fw_patch,
                ]),
            );
        }

        // for fresh devices, we can assume that all releases are actually "new"
        return releases2;
    }

    // otherwise we are in firmware mode and because each release in releases list has
    // version higher than the previous one, we can filter out the version that is already
    // installed and show only what's new!
    return releases2.filter(r =>
        versionUtils.isNewer(r.version, [
            features.major_version,
            features.minor_version,
            features.patch_version,
        ]),
    );
};

const isNewer = (
    release: FirmwareRelease | ConditionalRelease['release'],
    features: StrictFeatures,
) => {
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

export interface GetInfoProps {
    features: Features;
    releases: FirmwareRelease[];
}

// eslint-disable-next-line @typescript-eslint/no-shadow
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
            // in bootloader, T2T1 or newer devices know their firmware, so we still may filter "by firmware".
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

const calculateShouldOfferRelease = (rolloutProbability: number) => {
    if (rolloutProbability < 0 || rolloutProbability > 100) {
        throw new Error('Probability must be between 0 and 100.');
    }
    const randomValue = Math.random() * 100;

    return randomValue <= rolloutProbability;
};

const getReleaseMessageInfo = ({
    features,
    release,
    conditions,
}: {
    features: Features;
    release: ConditionalRelease['release'];
    conditions: ConditionalRelease['conditions'];
}): ReleaseMessageInfo => {
    console.log('getReleaseMessageInfo');
    const {
        bootloader_mode,
        major_version,
        minor_version,
        patch_version,
        internal_model,
        fw_major,
        fw_minor,
        fw_patch,
    } = features;

    const firmwareVersionInBootloaderMode = [fw_major, fw_minor, fw_patch];
    console.log('firmwareVersionInBootloaderMode', firmwareVersionInBootloaderMode);
    const version = [major_version, minor_version, patch_version];
    const firmwareVersion = bootloader_mode ? firmwareVersionInBootloaderMode : version;
    console.log('firmwareVersion', firmwareVersion);

    if (!versionUtils.isVersionArray(firmwareVersion)) {
        throw new Error('Firmware version is not version array.');
    }

    console.log('checking isStrictFeatures');
    if (!isStrictFeatures(features)) {
        throw new Error('Features of unexpected shape provided.');
    }
    console.log('checking isValidMessageRelease');
    if (!isValidMessageRelease(release)) {
        throw new Error(`Release object in unexpected shape.`);
    }
    const isNewerResult = isNewer(release, features);
    if (!firmwareVersion) {
        throw new Error('Firmware to update is lower version');
    }

    const { min_firmware_version, required } = release;
    console.log('min_firmware_version', min_firmware_version);
    console.log('firmwareVersion', firmwareVersion);

    const requiresIntermediary = versionUtils.isNewer(min_firmware_version, firmwareVersion);
    const intermediary = requiresIntermediary
        ? getIntermediaryMessageRelease(internal_model, firmwareVersion)
        : undefined;

    const { rollout_probability } = conditions;

    const shouldBeOffered = calculateShouldOfferRelease(rollout_probability);

    return {
        changelog: [],
        releaseConditions: {
            ...conditions,
            shouldBeOffered,
        },
        release,
        intermediary,
        isRequired: required,
        isNewer: isNewerResult,
        // translations available to be installed
        // TODO(karliatto): we kind of need translations in releases message.
        translations: [],
    };
};

/**
 * Get info about available firmware update.
 * For T1B1, it always returns the latest firmware plus intermediaryVersion
 * needed to get to the latest if it's not available for direct install.
 * @param features
 * @param releases
 */
// eslint-disable-next-line @typescript-eslint/no-shadow
export const getInfo = ({ features, releases }: GetInfoProps): ReleaseInfo | null => {
    if (!Array.isArray(releases) || releases.length < 1) {
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
    const prevRelease = releasesParsed[1];

    const isNewerResult = isNewer(latest, features); // do not consider safe releases, we want to show "outdated" even if it's not safe to update

    return {
        changelog,
        // release available to be installed
        release,
        isRequired: isRequired(changelog),
        isNewer: isNewerResult,
        // translations available to be installed
        translations: isNewerResult ? prevRelease?.translations : release?.translations,
    };
};

export const getReleaseInfo = (features: Features) => {
    return getInfo({
        features,
        releases: getReleases(features?.internal_model),
    });
};

export const getMessageReleaseInfo = (features: Features, firmwareType: FirmwareType) => {
    const deviceMessageRelease = getMessageRelease(features?.internal_model, firmwareType);
    if (!deviceMessageRelease) {
        throw new Error('Missing message release for device');
    }
    const { release, conditions } = deviceMessageRelease;
    // TODO(karliatto): it seams that we use `getReleaseMessageInfo` to do sanity checks in fw and releases.
    // TODO(karliatto): why not been more clear and do a check release message and relase ???
    return getReleaseMessageInfo({
        features,
        release,
        conditions,
    });
};

export const getFirmwareStatus = (features: Features, firmwareType: FirmwareType) => {
    // indication that firmware is not installed at all. This information is set to false in bl mode. Otherwise it is null.
    if (features.firmware_present === false) {
        return 'none';
    }
    // for T1B1 in bootloader, what device reports as firmware version is in fact bootloader version, so we can
    // not safely tell firmware version
    if (features.major_version === 1 && features.bootloader_mode) {
        return 'unknown';
    }

    const releaseInfo = getMessageReleaseInfo(features, firmwareType);

    // should never happen for official firmware, see getInfo
    if (!releaseInfo) return 'custom';

    if (releaseInfo.isRequired) return 'required';

    if (releaseInfo.isNewer) return 'outdated';

    return 'valid';
};

export const getRelease = (
    internalModel: DeviceModelInternal,
    firmwareVersion: VersionArray | undefined,
): FirmwareRelease | undefined =>
    getReleases(internalModel).find(
        r =>
            firmwareVersion &&
            versionUtils.isVersionArray(firmwareVersion) &&
            versionUtils.isEqual(r.version, firmwareVersion),
    );

type GetFirmwareLocationParam =
    | {
          firmwareVersion: VersionArray;
          internalModel: DeviceModelInternal;
          firmwareType: FirmwareType;
          isIntermediary: false;
      }
    | {
          firmwareVersion: number;
          internalModel: DeviceModelInternal;
          firmwareType: FirmwareType;
          isIntermediary: true;
      };

export const getFirmwareLocation = ({
    firmwareVersion,
    internalModel,
    firmwareType,
    isIntermediary,
}: GetFirmwareLocationParam) => {
    const bundledBaseUrl = DataManager.getSettings('binFilesBaseUrl');
    const localFirmwares = DataManager.getLocalFirmwares();
    const { firmwareDir, firmwares } = localFirmwares;

    let firmwareName;
    if (isIntermediary) {
        firmwareName = buildIntermediaryFirmwareFileName(internalModel, firmwareVersion);
    } else {
        firmwareName = buildFirmwareFileName(firmwareType, internalModel, firmwareVersion);
    }
    const useLocalBinary = firmwares.includes(firmwareName);
    const isBundledRelease = bundledReleases[internalModel].version == firmwareVersion;
    let baseUrl = `https://data.trezor.io/firmware/${internalModel.toLocaleLowerCase()}`;

    if (isBundledRelease && bundledBaseUrl) {
        baseUrl = bundledBaseUrl;
    } else if (useLocalBinary) {
        baseUrl = firmwareDir;
    }

    return {
        baseUrl,
        firmwareName,
    };
};

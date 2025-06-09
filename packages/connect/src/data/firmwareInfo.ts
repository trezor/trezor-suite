// origin: https://github.com/trezor/connect/blob/develop/src/js/data/FirmwareInfo.js

import {
    DeviceModelInternal,
    FirmwareRelease,
    FirmwareType,
    VersionArray,
} from '@trezor/device-utils';
import {
    ConditionalRelease,
    FirmwareReleaseConfig,
    IntermediaryReleaseConfig,
} from '@trezor/firmware-release-config/src/types';
import { getIntegerInRangeFromString, versionUtils } from '@trezor/utils';

import type { Features, FirmwareReleaseConfigInfo } from '../types';
import { DataManager } from './DataManager';
import { httpRequest } from '../utils/assets';
import {
    buildFirmwareFileName,
    buildIntermediaryFirmwareFileName,
    isStrictFeatures,
    isValidReleases,
} from '../utils/firmwareUtils';

// undefined releases should never happen for official firmware, only custom
const releases = Object.values(DeviceModelInternal).reduce(
    (acc, key) => ({ ...acc, [key]: [] }),
    {} as Record<keyof typeof DeviceModelInternal, FirmwareRelease[] | undefined>,
);

let firmwareReleasesConfig: FirmwareReleaseConfig['releases'] | undefined;
let firmwareIntermediaryReleasesConfig:
    | Record<keyof typeof DeviceModelInternal, IntermediaryReleaseConfig[]>
    | undefined;
const bundledReleases: Record<keyof typeof DeviceModelInternal, FirmwareRelease | undefined> =
    {} as Record<keyof typeof DeviceModelInternal, FirmwareRelease>;

export const parseFirmwareReleases = (
    modelReleases: FirmwareRelease[],
    deviceModel: DeviceModelInternal,
) => {
    const [latestRelease] = modelReleases;
    bundledReleases[deviceModel] = latestRelease;
    modelReleases.forEach(release => {
        releases[deviceModel]?.push({
            ...release,
        });
    });
};

export const getReleases = (deviceModel: DeviceModelInternal) => releases[deviceModel] || [];

export const getOnlineReleases = async (internalModel: DeviceModelInternal) => {
    const url = `https://data.trezor.io/firmware/${internalModel.toLowerCase()}/releases.json`;

    const response = await httpRequest(url, 'json', {
        signal: AbortSignal.timeout(10000),
        skipLocalForceDownload: true,
    });

    if (isValidReleases(response)) {
        return response;
    }

    return [] as FirmwareRelease[];
};

export const parseFirmwareReleaseConfig = (config: FirmwareReleaseConfig) => {
    firmwareReleasesConfig = config.releases;
    firmwareIntermediaryReleasesConfig = config.intermediaries;

    return {
        releases,
        intermediaryReleases: firmwareIntermediaryReleasesConfig,
    };
};

const getCurrentVersion = (
    features: Features,
): {
    bootloaderVersion: VersionArray | null;
    firmwareVersion: VersionArray;
} => {
    if (!isStrictFeatures(features)) {
        throw new Error('Features of unexpected shape provided.');
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

    // When Trezor device is in Firmware mode the `features`:
    //  * `major/minor/patch_version` --> it is the firmware version
    //  * `fw_major/minor/patch` --> null
    // When Trezor device is in Bootloader mode the `features`:
    //  * `major/minor/patch_version` --> it is the bootloader version
    //  * `fw_major/minor/patch` --> it is the firmware version

    // `fw_version` is the firmware version when in bootloader mode, in firmware mode it will be [null, null, null]
    const fw_version = [fw_major, fw_minor, fw_patch] as VersionArray;
    // `version` is bootloader version when in bootloader mode, in firmware mode it is firmware version.
    const version = [major_version, minor_version, patch_version] as VersionArray;

    // In Firmware mode it is for now not possible to know the bootloader version.
    const bootloaderVersion = bootloader_mode ? version : null;

    // Some old version of T1B1 do not report FW version in bootloader mode,
    // so it is not 100% true that in bootloader mode we will know the firmware version,
    // but we are handling it `getReleaseInfo` when device is T1B1 we use bootloader version.
    const firmwareVersion = bootloader_mode ? fw_version : version;

    return {
        bootloaderVersion,
        firmwareVersion,
    };
};

const getIntermediaryMessageRelease = (features: Features) => {
    const { internal_model } = features;

    if (!firmwareIntermediaryReleasesConfig) {
        throw new Error('Firmware release config not loaded.');
    }

    const deviceIntermediaryReleases = firmwareIntermediaryReleasesConfig[internal_model];
    if (!deviceIntermediaryReleases) {
        // There are not intermediary releases for this model.
        return undefined;
    }
    let intermediary;

    if (features.bootloader_mode) {
        const { bootloaderVersion } = getCurrentVersion(features);
        intermediary = deviceIntermediaryReleases.find(
            inter =>
                bootloaderVersion &&
                versionUtils.isNewer(inter.min_bootloader_version, bootloaderVersion),
        );
    } else {
        const { firmwareVersion } = getCurrentVersion(features);
        intermediary = deviceIntermediaryReleases.find(inter =>
            versionUtils.isNewer(inter.min_firmware_version, firmwareVersion),
        );
    }

    return intermediary || undefined; // Return null if no intermediary is found
};

export const getReleaseConfig = (features: Features, firmwareType: FirmwareType) => {
    const { internal_model } = features;

    if (internal_model === DeviceModelInternal.UNKNOWN) {
        return undefined;
    }

    if (!firmwareReleasesConfig) {
        throw new Error('Firmware release config not loaded.');
    }
    const deviceMessageRelease = firmwareReleasesConfig[internal_model];
    if (!deviceMessageRelease) {
        throw new Error(`No firmware release config found for device model ${internal_model}`);
    }

    return deviceMessageRelease.find(item => item.firmware_type === firmwareType);
};

const getIsBitcoinOnlyAvailable = (features: Features) => {
    const { internal_model } = features;
    if (internal_model === DeviceModelInternal.UNKNOWN) {
        return false;
    }

    if (!firmwareReleasesConfig) {
        throw new Error('Firmware release config not loaded.');
    }

    const deviceMessageRelease = firmwareReleasesConfig[internal_model];

    return deviceMessageRelease.some(item => item.firmware_type === FirmwareType.BitcoinOnly);
};

const isValidConditionalRelease = (conditionalRelease: ConditionalRelease['release']): boolean =>
    !!(
        conditionalRelease.version &&
        conditionalRelease.min_firmware_version &&
        conditionalRelease.min_bootloader_version
    );

const calculateShouldOfferRelease = (
    rolloutProbability: number,
    deviceId: string | null,
): boolean => {
    if (rolloutProbability < 0 || rolloutProbability > 100) {
        throw new Error('Probability must be between 0 and 100.');
    }

    if (deviceId === null) {
        // When deviceId is null, it means device is fresh so we always want to install latest FW,
        // unless rolloutProbability is 0, in that case we should never offer it.
        return rolloutProbability > 0;
    } else {
        // If deviceId is provided, use the deterministic approach.
        const deterministicValueToCompare = getIntegerInRangeFromString(deviceId, 101);

        return deterministicValueToCompare < rolloutProbability;
    }
};

interface GetReleaseInfoParams {
    features: Features;
    release: ConditionalRelease['release'];
    conditions: ConditionalRelease['conditions'];
    intermediary: IntermediaryReleaseConfig | undefined;
    firmwareType: ConditionalRelease['firmware_type'];
    isBitcoinOnlyAvailable: boolean;
}

export const getReleaseInfo = ({
    features,
    release,
    conditions,
    intermediary,
    firmwareType,
    isBitcoinOnlyAvailable,
}: GetReleaseInfoParams): FirmwareReleaseConfigInfo => {
    if (!isStrictFeatures(features)) {
        throw new Error('Features of unexpected shape provided.');
    }
    if (!isValidConditionalRelease(release)) {
        throw new Error(`Release object in unexpected shape.`);
    }
    const { min_firmware_version, min_bootloader_version, required } = release;

    let isNewerResult = false;
    let requiresIntermediary = false;

    if (
        features.internal_model === DeviceModelInternal.T1B1 &&
        features.bootloader_mode &&
        release.bootloader_version
    ) {
        // Some old version of T1B1 do not report FW version in bootloader mode.
        const { bootloaderVersion } = getCurrentVersion(features);
        isNewerResult =
            !!bootloaderVersion &&
            versionUtils.isNewer(release.bootloader_version, bootloaderVersion);
        requiresIntermediary =
            !!bootloaderVersion && versionUtils.isNewer(min_bootloader_version, bootloaderVersion);
    } else {
        const { firmwareVersion } = getCurrentVersion(features);
        if (!versionUtils.isVersionArray(firmwareVersion)) {
            throw new Error('Firmware version is not version array.');
        }

        isNewerResult = versionUtils.isNewer(release.version, firmwareVersion);
        requiresIntermediary = versionUtils.isNewer(min_firmware_version, firmwareVersion);
    }

    const { rollout_probability } = conditions;
    const shouldBeOffered = calculateShouldOfferRelease(rollout_probability, features.device_id);

    return {
        firmwareType,
        isBitcoinOnlyAvailable,
        releaseConditions: {
            ...conditions,
            shouldBeOffered,
        },
        release,
        intermediary: requiresIntermediary ? intermediary : undefined,
        isRequired: required,
        isNewer: isNewerResult,
        translations: release.translations || [],
    };
};

export const getFirmwareReleaseConfig = (features: Features, firmwareType: FirmwareType) => {
    const deviceMessageRelease = getReleaseConfig(features, firmwareType);
    if (!deviceMessageRelease) {
        throw new Error('Missing Firmware release config release for device');
    }
    const { release, conditions, firmware_type } = deviceMessageRelease;

    const intermediary = getIntermediaryMessageRelease(features);

    const isBitcoinOnlyAvailable = getIsBitcoinOnlyAvailable(features);

    return getReleaseInfo({
        isBitcoinOnlyAvailable,
        features,
        release,
        conditions,
        intermediary,
        firmwareType: firmware_type,
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

    const releaseInfo = getFirmwareReleaseConfig(features, firmwareType);

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

type GetFirmwareLocationParam = {
    firmwareVersion: VersionArray;
    internalModel: DeviceModelInternal;
    firmwareType: FirmwareType;
    intermediaryVersion?: number;
};

export const getFirmwareLocation = ({
    firmwareVersion,
    internalModel,
    firmwareType,
    intermediaryVersion,
}: GetFirmwareLocationParam) => {
    const bundledBaseUrl = DataManager.getSettings('binFilesBaseUrl');
    const localFirmwares = DataManager.getLocalFirmwares();
    const { firmwareDir, firmwareList } = localFirmwares;

    let firmwareName;
    if (intermediaryVersion) {
        firmwareName = buildIntermediaryFirmwareFileName(internalModel, intermediaryVersion);
    } else {
        firmwareName = buildFirmwareFileName(firmwareType, internalModel, firmwareVersion);
    }
    const version = intermediaryVersion ? intermediaryVersion : firmwareVersion;
    const useLocalBinary = firmwareList.includes(firmwareName);
    const isBundledRelease =
        bundledReleases[internalModel] && bundledReleases[internalModel].version === version;
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

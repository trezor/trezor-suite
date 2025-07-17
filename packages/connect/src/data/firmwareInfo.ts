// origin: https://github.com/trezor/connect/blob/develop/src/js/data/FirmwareInfo.js

import {
    ConditionalRelease,
    DeviceModelInternal,
    FirmwareRelease,
    FirmwareReleaseConfig,
    IntermediaryReleaseConfig,
    VersionArray,
} from '@trezor/device-utils';
import { getIntegerInRangeFromString, removeTrailingSlashes, versionUtils } from '@trezor/utils';

import { Features, FirmwareReleaseConfigInfo, FirmwareType } from '../types';
import { DataManager } from './DataManager';
import { getReleaseAsset } from '../utils/assetUtils';
import { httpRequest } from '../utils/assets';
import { getOnlyLocalFirmwareReleaseConfig } from '../utils/firmwareReleaseConfigUtils';
import {
    buildIntermediaryFirmwareFileName,
    buildLocalFirmwareFileName,
    isStrictFeatures,
} from '../utils/firmwareUtils';

const firmwareReleasesConfig: Partial<
    Record<keyof typeof DeviceModelInternal, Record<FirmwareType, ConditionalRelease>>
> = {};
let firmwareIntermediaryReleasesConfig:
    | Record<keyof typeof DeviceModelInternal, IntermediaryReleaseConfig[]>
    | undefined;

export type FirmwareUpdateSource = 'production' | 'test-unsigned' | 'test-signed';
interface RemoteBaseInfo {
    BASE_URL: string;
    MIDDLE_PATH: string;
}
const RELEASES_URL_REMOTE_BASE = {
    BASE_URL: 'https://data.trezor.io',
    MIDDLE_PATH: 'firmware',
};
const UNSIGNED_URL_REMOTE_BASE = {
    BASE_URL: 'https://suite.corp.sldev.cz',
    MIDDLE_PATH: 'firmware/unsigned',
};
const SIGNED_URL_REMOTE_BASE = {
    BASE_URL: 'https://suite.corp.sldev.cz',
    MIDDLE_PATH: 'firmware/signed',
};
const FIRMWARE_REMOTE_BASE_URLS: Record<FirmwareUpdateSource, RemoteBaseInfo> = {
    production: RELEASES_URL_REMOTE_BASE,
    'test-unsigned': UNSIGNED_URL_REMOTE_BASE,
    'test-signed': SIGNED_URL_REMOTE_BASE,
};

export const getOnlineFirmwareBaseUrl = () => {
    const firmwareUpdateSource = DataManager.getSettings('firmwareUpdateSource');

    if (!firmwareUpdateSource) {
        // If for some reason `firmwareUpdateSource` settings is not set we return production one.
        return FIRMWARE_REMOTE_BASE_URLS['production'];
    }

    return FIRMWARE_REMOTE_BASE_URLS[firmwareUpdateSource];
};

// We use `bundledReleases` to know what are the binaries that are bundled so we do not need to download them if they are needed.
const getBundledVersionByDeviceAndFwType = (
    deviceModel: DeviceModelInternal,
    firmwareType: FirmwareType,
) => {
    const localFirmwareReleaseConfig = getOnlyLocalFirmwareReleaseConfig();
    const modelReleases = localFirmwareReleaseConfig.releases[deviceModel];
    const bundledRelease = modelReleases[firmwareType];
    // Extracts the version from the filename, 't2b1-2.6.3-bitcoinonly.json' -> '2.6.3'.
    const bundledVersion = bundledRelease.releasePath.match(/(\d+\.\d+\.\d+)/);

    if (!bundledVersion) {
        throw new Error('Fimrware bundled version was not found.');
    }

    return bundledVersion[0];
};

export const getBundledRelease = (deviceModel: DeviceModelInternal, firmwareType: FirmwareType) => {
    const version = getBundledVersionByDeviceAndFwType(deviceModel, firmwareType);
    const versionArray = versionUtils.tryParse(version);
    if (!versionArray) {
        throw new Error('There was error parsing bundled release.');
    }

    return getReleaseAsset(deviceModel, versionArray, firmwareType);
};

const getOnlineReleaseByPath = async (releasePath: string) => {
    const onlineFirmwareBaseUrl = getOnlineFirmwareBaseUrl();
    const url = `${onlineFirmwareBaseUrl.BASE_URL}/${releasePath}`;

    const response = await httpRequest(url, 'json', {
        signal: AbortSignal.timeout(10000),
        skipLocalForceDownload: true,
    });

    return response as FirmwareRelease;
};

export const getOnlineReleaseByVersion = (
    deviceModel: DeviceModelInternal,
    firmwareVersion: VersionArray,
    firmwareType: FirmwareType,
) => {
    const onlineFirmwareBaseUrl = getOnlineFirmwareBaseUrl();
    const releasePath = `${onlineFirmwareBaseUrl.BASE_URL}${deviceModel.toLowerCase()}-${firmwareVersion.join('.')}-${firmwareType}.json`;

    return getOnlineReleaseByPath(releasePath);
};

// Gets a specific firmware release by version.
// It will first attempt to find a matching version in the bundled releases to avoid a network request.
// If no matching bundled release is found, it will fall back to fetching the release from the online source.
export const getReleaseByVersion = async (
    deviceModel: DeviceModelInternal,
    firmwareVersion: VersionArray,
    firmwareType: FirmwareType,
): Promise<FirmwareRelease> => {
    // TODO(karliatto): we should try to get it from firmwareReleaseConfig
    try {
        return getReleaseAsset(deviceModel, firmwareVersion, firmwareType);
    } catch {
        // We didn't find it in the bundled releases JSON files.
    }

    // TODO(karliatto): if this request fails, it should probably not throw an error.
    // If we don't find it in bundled we fetch it online.
    return await getOnlineReleaseByVersion(deviceModel, firmwareVersion, firmwareType);
};

export const parseFirmwareReleaseConfig = async (config: FirmwareReleaseConfig) => {
    const releasePromises = Object.keys(config.releases).map(async deviceModel => {
        const modelKey = deviceModel as DeviceModelInternal;
        if (modelKey === DeviceModelInternal.UNKNOWN) {
            return;
        }

        const { 'bitcoin-only': bitcoinOnlyConfig, universal: universalConfig } =
            config.releases[modelKey] ?? {};

        if (!bitcoinOnlyConfig?.releasePath || !universalConfig?.releasePath) {
            return;
        }

        const [bitcoinOnlyRelease, universalRelease] = await Promise.all([
            getOnlineReleaseByPath(bitcoinOnlyConfig.releasePath),
            getOnlineReleaseByPath(universalConfig.releasePath),
        ]);

        if (!universalRelease || !bitcoinOnlyRelease) {
            return;
        }

        return {
            deviceModel: modelKey,
            releases: {
                [FirmwareType.BitcoinOnly]: {
                    ...bitcoinOnlyConfig,
                    release: bitcoinOnlyRelease,
                },
                [FirmwareType.Universal]: {
                    ...universalConfig,
                    release: universalRelease,
                },
            },
        };
    });

    const resolvedReleases = await Promise.all(releasePromises);

    // Filter out any null results and populate the configuration
    resolvedReleases.forEach(result => {
        if (result) {
            firmwareReleasesConfig[result.deviceModel] = result.releases;
        }
    });

    firmwareIntermediaryReleasesConfig = config.intermediaries;
};

export const getLanguage = (languageBinPath: string) => {
    const baseUrl = getOnlineFirmwareBaseUrl();
    const url = `${baseUrl}/${languageBinPath}`;

    return httpRequest(url, 'binary');
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
    // when device is factory reset will always be in bootloader mode.
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

    return intermediary || undefined;
};

const getReleaseConfig = (features: Features, firmwareType: FirmwareType) => {
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

    return deviceMessageRelease[firmwareType];
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

    return !!deviceMessageRelease && !!deviceMessageRelease[FirmwareType.BitcoinOnly];
};

const isValidConditionalRelease = (release: FirmwareRelease): boolean =>
    !!(release.version && release.min_firmware_version && release.min_bootloader_version);

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
    release: FirmwareRelease;
    conditions: ConditionalRelease['conditions'];
    intermediary: IntermediaryReleaseConfig | undefined;
    firmwareType: FirmwareType;
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

    if (features.bootloader_mode && release.bootloader_version) {
        // Some old version of T1B1 do not report FW version in bootloader mode and some other devices do not
        // report FW version in bootloader mode when factory reset, so safest approach is to use always bootloader version
        // when in bootloader mode.
        const { bootloaderVersion } = getCurrentVersion(features);
        if (!versionUtils.isVersionArray(bootloaderVersion)) {
            throw new Error('Bootloader version is not version array.');
        }
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
        translations: release.translations,
    };
};

export const getFirmwareReleaseConfigInfo = (features: Features, firmwareType: FirmwareType) => {
    const deviceMessageRelease = getReleaseConfig(features, firmwareType);
    if (!deviceMessageRelease) {
        throw new Error('Missing Firmware release config release for device');
    }
    const { release, conditions, firmware_type } = deviceMessageRelease;
    if (!release) {
        throw new Error('Missing Firmware release for device');
    }

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

    const releaseInfo = getFirmwareReleaseConfigInfo(features, firmwareType);

    // should never happen for official firmware, see getInfo
    if (!releaseInfo) return 'custom';

    if (releaseInfo.isRequired) return 'required';

    if (releaseInfo.isNewer) return 'outdated';

    return 'valid';
};

type GetFirmwareLocationParam = {
    firmwareVersion: VersionArray;
    remotePath: string;
    deviceModel: DeviceModelInternal;
    firmwareType: FirmwareType;
    intermediaryVersion?: number;
};

export const getFirmwareLocation = ({
    firmwareVersion,
    remotePath,
    deviceModel,
    firmwareType,
    intermediaryVersion,
}: GetFirmwareLocationParam) => {
    const firmwareName = intermediaryVersion
        ? buildIntermediaryFirmwareFileName(deviceModel, intermediaryVersion)
        : buildLocalFirmwareFileName(firmwareType, deviceModel, firmwareVersion);

    const versionString = intermediaryVersion
        ? String(intermediaryVersion)
        : firmwareVersion.join('.');

    const bundledBaseUrl = removeTrailingSlashes(DataManager.getSettings('binFilesBaseUrl'));
    const bundledVersion = getBundledVersionByDeviceAndFwType(deviceModel, firmwareType);

    if (bundledBaseUrl && bundledVersion === versionString) {
        return {
            baseUrl: bundledBaseUrl,
            path: `firmware/${deviceModel.toLowerCase()}/${firmwareName}`,
        };
    }

    const { firmwareDir, firmwareList } = DataManager.getLocalFirmwares();
    if (firmwareList.includes(firmwareName)) {
        return {
            baseUrl: firmwareDir,
            path: firmwareName,
        };
    }

    const onlineBaseUrl = getOnlineFirmwareBaseUrl();

    return {
        baseUrl: onlineBaseUrl.BASE_URL,
        path: remotePath,
    };
};

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
import { getReleaseAsset, getReleasesAssetByDeviceModelAndFirmwareType } from '../utils/assetUtils';
import { httpRequest } from '../utils/assets';
import { getOnlyLocalFirmwareReleaseConfig } from '../utils/firmwareReleaseConfigUtils';
import {
    buildIntermediaryFirmwareFileName,
    buildLocalFirmwareFileName,
    findBestCompatibleRelease,
    isStrictFeatures,
} from '../utils/firmwareUtils';

export type FirmwareUpdateSource =
    | 'production'
    | 'test-unsigned'
    | 'test-signed'
    | 'localhost-unsigned'
    | 'localhost-signed';
interface RemoteBaseInfo {
    BASE_URL: string;
    MIDDLE_PATH: string;
}
const RELEASES_URL_REMOTE_BASE = {
    BASE_URL: 'https://data.trezor.io',
    MIDDLE_PATH: 'firmware',
};
const UNSIGNED_URL_REMOTE_BASE = {
    BASE_URL: 'https://data.trezor.io',
    MIDDLE_PATH: 'dev/firmware/releases/unsigned',
};
const SIGNED_URL_REMOTE_BASE = {
    BASE_URL: 'https://suite.corp.sldev.cz',
    MIDDLE_PATH: 'firmware/signed',
};
const SIGNED_LOCALHOST = {
    BASE_URL: 'http://localhost:3000',
    MIDDLE_PATH: 'firmware/signed',
};
const UNSIGNED_LOCALHOST = {
    BASE_URL: 'http://localhost:3000',
    MIDDLE_PATH: 'firmware/signed',
};
const FIRMWARE_REMOTE_BASE_URLS: Record<FirmwareUpdateSource, RemoteBaseInfo> = {
    production: RELEASES_URL_REMOTE_BASE,
    'test-unsigned': UNSIGNED_URL_REMOTE_BASE,
    'test-signed': SIGNED_URL_REMOTE_BASE,
    'localhost-unsigned': UNSIGNED_LOCALHOST,
    'localhost-signed': SIGNED_LOCALHOST,
};

export const getOnlineFirmwareBaseUrl = () => {
    const firmwareUpdateSource = DataManager.getSettings('firmwareUpdateSource');

    if (!firmwareUpdateSource) {
        // If for some reason `firmwareUpdateSource` settings is not set we return production one.
        return {
            ...FIRMWARE_REMOTE_BASE_URLS['production'],
            env: 'production' as FirmwareUpdateSource,
        };
    }

    return {
        ...FIRMWARE_REMOTE_BASE_URLS[firmwareUpdateSource],
        env: firmwareUpdateSource,
    };
};

// We use `bundledReleases` to know what are the binaries that are bundled so we do not need to download them if they are needed.
const getBundledFirmwareVersion = (
    deviceModel: DeviceModelInternal,
    firmwareType: FirmwareType,
) => {
    const { config: localFirmwareReleaseConfig } = getOnlyLocalFirmwareReleaseConfig();
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
    const version = getBundledFirmwareVersion(deviceModel, firmwareType);
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

export const getOnlineReleaseByVersion = async (
    deviceModel: DeviceModelInternal,
    firmwareVersion: VersionArray,
    firmwareType: FirmwareType,
) => {
    const onlineFirmwareBaseUrl = getOnlineFirmwareBaseUrl();
    const firmwareTypeFileString =
        firmwareType === FirmwareType.BitcoinOnly ? 'bitcoinonly' : 'universal';
    const relaseJsonFilename = `${deviceModel.toLowerCase()}-${firmwareVersion.join('.')}-${firmwareTypeFileString}.json`;
    const origin = `${onlineFirmwareBaseUrl.MIDDLE_PATH}/${deviceModel.toLowerCase()}/${firmwareTypeFileString}`;
    const releasePath = `${origin}/${relaseJsonFilename}`;

    const onlineRelease = await getOnlineReleaseByPath(releasePath);
    if (!onlineRelease || !versionUtils.isEqual(onlineRelease.version, firmwareVersion)) {
        return;
    }

    return onlineRelease;
};

export const getReleaseConfig = (features: Features, firmwareType: FirmwareType) => {
    const { internal_model } = features;
    if (internal_model === DeviceModelInternal.UNKNOWN) {
        return undefined;
    }
    const firmwareReleaseConfig = DataManager.getFirmwareReleaseConfig();

    if (!firmwareReleaseConfig) {
        throw new Error('Firmware release config not loaded.');
    }
    const deviceMessageRelease = firmwareReleaseConfig[internal_model];
    if (!deviceMessageRelease) {
        return;
    }

    return deviceMessageRelease[firmwareType];
};

// Gets a specific firmware release by version.
// First it will check if the required released is part of the firmware release config, if so then use that.
// The reason for that is that if the release is in the firmware release config it might be from remote so we nee to use that.
// If not then it will attempt to find a matching version in the bundled releases to avoid a network request.
// If no matching bundled release is found, it will fall back to fetching the release from the online source.
export const getReleaseByVersion = async (
    features: Features,
    firmwareVersion: VersionArray,
    firmwareType: FirmwareType,
): Promise<FirmwareRelease | undefined> => {
    const deviceModel = features.internal_model;

    const tryGetRelease = async (
        getter: () => Promise<FirmwareRelease | undefined> | FirmwareRelease | undefined,
    ): Promise<FirmwareRelease | undefined> => {
        try {
            return await getter();
        } catch {
            return;
        }
    };

    const releaseFromConfig = getReleaseConfig(features, firmwareType)?.release;
    if (releaseFromConfig && versionUtils.isEqual(firmwareVersion, releaseFromConfig.version)) {
        return releaseFromConfig;
    }

    const release =
        // Orden is important!
        (await tryGetRelease(() => getReleaseAsset(deviceModel, firmwareVersion, firmwareType))) ||
        (await tryGetRelease(() =>
            getOnlineReleaseByVersion(deviceModel, firmwareVersion, firmwareType),
        ));

    // Sanity check to make sure we provide the required release.
    if (release && versionUtils.isEqual(release.version, firmwareVersion)) {
        return release;
    }

    return;
};

// We can build the local firmware release config only using local bundled releases JSON, and we will need to use it
// it is not possible to build the remote one.
export const createLocalFirmwareConfig = (baseConfig: FirmwareReleaseConfig) => {
    const releaseEntries = Object.entries(baseConfig.releases)
        .map(([deviceModel, modelReleases]) => {
            const modelKey = deviceModel as DeviceModelInternal;

            if (modelKey === DeviceModelInternal.UNKNOWN) return null;

            const { 'bitcoin-only': bitcoinOnlyConfig, universal: universalConfig } =
                modelReleases ?? {};
            if (!bitcoinOnlyConfig?.releasePath || !universalConfig?.releasePath) return null;

            const btcOnlyRelease = getBundledRelease(modelKey, FirmwareType.BitcoinOnly);
            const universalRelease = getBundledRelease(modelKey, FirmwareType.Universal);

            if (!btcOnlyRelease || !universalRelease) return null;

            const releases = {
                [FirmwareType.BitcoinOnly]: { ...bitcoinOnlyConfig, release: btcOnlyRelease },
                [FirmwareType.Universal]: { ...universalConfig, release: universalRelease },
            };

            return [modelKey, releases];
        })
        .filter(entry => entry !== null);

    return Object.fromEntries(releaseEntries);
};

export const createRemoteFirmwareConfig = async (config: FirmwareReleaseConfig) => {
    const releaseEntryPromises = Object.entries(config.releases).map(
        async ([deviceModel, modelReleases]) => {
            const modelKey = deviceModel as DeviceModelInternal;

            if (modelKey === DeviceModelInternal.UNKNOWN) return null;

            const { 'bitcoin-only': bitcoinOnlyConfig, universal: universalConfig } =
                modelReleases ?? {};
            if (!bitcoinOnlyConfig?.releasePath || !universalConfig?.releasePath) return null;

            const [bitcoinOnlyRelease, universalRelease] = await Promise.all([
                getOnlineReleaseByPath(bitcoinOnlyConfig.releasePath),
                getOnlineReleaseByPath(universalConfig.releasePath),
            ]);

            if (!universalRelease || !bitcoinOnlyRelease) return null;

            const releases = {
                [FirmwareType.BitcoinOnly]: {
                    ...bitcoinOnlyConfig,
                    release: bitcoinOnlyRelease,
                },
                [FirmwareType.Universal]: { ...universalConfig, release: universalRelease },
            };

            return [modelKey, releases];
        },
    );

    const validEntries = (await Promise.all(releaseEntryPromises)).filter(entry => entry !== null);

    return Object.fromEntries(validEntries);
};

export const initializeFirmwareConfig = async (
    config: FirmwareReleaseConfig,
    isRemote: boolean,
) => {
    if (isRemote) {
        try {
            const remoteReleases = await createRemoteFirmwareConfig(config);

            return {
                releases: remoteReleases,
                intermediaries: config.intermediaries,
            };
        } catch {
            // There was an error fetching the remote data for config, we ignore it and use local config.
        }
    }

    // We had some issue getting remote so we use local data.
    const { config: localFirmwareReleaseConfig } = getOnlyLocalFirmwareReleaseConfig();
    const localReleases = createLocalFirmwareConfig(localFirmwareReleaseConfig);

    return {
        releases: localReleases,
        intermediaries: localFirmwareReleaseConfig.intermediaries,
    };
};

export const getLanguage = (languageBinPath: string) => {
    const baseUrl = getOnlineFirmwareBaseUrl();
    const url = `${baseUrl.BASE_URL}/${languageBinPath}`;

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
    const firmwareIntermediaryReleasesConfig = DataManager.getFirmwareIntermediaryReleaseConfig();

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

const getIsBitcoinOnlyAvailable = (features: Features) => {
    const { internal_model } = features;
    if (internal_model === DeviceModelInternal.UNKNOWN) {
        return false;
    }

    const firmwareReleaseConfig = DataManager.getFirmwareReleaseConfig();

    if (!firmwareReleaseConfig) {
        throw new Error('Firmware release config not loaded.');
    }
    const deviceMessageRelease = firmwareReleaseConfig[internal_model];

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

    let isNewer = false;
    let requiresIntermediary = false;

    if (features.bootloader_mode && release.bootloader_version) {
        // Some old version of T1B1 do not report FW version in bootloader mode and some other devices do not
        // report FW version in bootloader mode when factory reset.
        const { bootloaderVersion, firmwareVersion } = getCurrentVersion(features);
        if (versionUtils.isVersionArray(firmwareVersion)) {
            // We first try to use firmwareVesion if it is available even in bootloader mode.
            isNewer = versionUtils.isNewer(release.version, firmwareVersion);
            requiresIntermediary = versionUtils.isNewer(min_firmware_version, firmwareVersion);
        } else if (versionUtils.isVersionArray(bootloaderVersion)) {
            // If we do not have firmwareVersion in bootloader mode then we use bootloader version
            // and compare with that from the new release info.
            isNewer = versionUtils.isNewer(release.bootloader_version, bootloaderVersion);
            requiresIntermediary = versionUtils.isNewer(min_bootloader_version, bootloaderVersion);
        } else {
            throw new Error('Version is not version array.');
        }
    } else {
        const { firmwareVersion } = getCurrentVersion(features);
        if (!versionUtils.isVersionArray(firmwareVersion)) {
            throw new Error('Firmware version is not version array.');
        }

        isNewer = versionUtils.isNewer(release.version, firmwareVersion);
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
        isNewer,
        translations: release.translations,
    };
};

export const getFirmwareReleaseConfigInfo = (features: Features, firmwareType: FirmwareType) => {
    const deviceMessageRelease = getReleaseConfig(features, firmwareType);
    if (!deviceMessageRelease) {
        return;
    }

    const { release, conditions, firmware_type } = deviceMessageRelease;
    if (!release) {
        return;
    }

    const currentVersion = getCurrentVersion(features);
    const inBootloaderMode = features.bootloader_mode && !!currentVersion.bootloaderVersion;
    const versionToCheck = inBootloaderMode
        ? currentVersion.bootloaderVersion!
        : currentVersion.firmwareVersion;
    const minVersionKey = inBootloaderMode ? 'min_bootloader_version' : 'min_firmware_version';

    const isCompatible = versionUtils.isNewer(versionToCheck, release[minVersionKey]);

    const compatibleRelease = isCompatible
        ? release
        : findBestCompatibleRelease(
              getReleasesAssetByDeviceModelAndFirmwareType(features.internal_model, firmwareType),
              currentVersion.firmwareVersion,
              minVersionKey,
          );

    const intermediary = getIntermediaryMessageRelease(features);
    const isBitcoinOnlyAvailable = getIsBitcoinOnlyAvailable(features);

    return getReleaseInfo({
        isBitcoinOnlyAvailable,
        features,
        release: compatibleRelease || release,
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
    // Here we care just to know if the binaries are bundled, in order to use them locally instead of fetching them
    // if they are in default remote we ignore it.
    const isRealBundled = !bundledBaseUrl.includes('data.trezor.io');
    const bundledVersion = getBundledFirmwareVersion(deviceModel, firmwareType);

    if (bundledBaseUrl && isRealBundled && bundledVersion === versionString) {
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

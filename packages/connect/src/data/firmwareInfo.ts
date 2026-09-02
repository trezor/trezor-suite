// origin: https://github.com/trezor/connect/blob/develop/src/js/data/FirmwareInfo.js

import type { Features, StrictFeatures } from '@trezor/connect-common/src/types/device';
import type {
    CurrentVersion,
    FirmwareChannel,
    FirmwareReleaseConfigInfo,
} from '@trezor/connect-common/src/types/firmware';
import { firmwareAssets, firmwareReleaseConfigAssets } from '@trezor/connect-data';
import type { FirmwareRelease, ReleasesConfig } from '@trezor/device-utils';
import {
    DeviceModelInternal,
    FirmwareType,
    getBootloaderVersionArray,
    getFirmwareOrBootloaderVersionArray,
    getFirmwareVersionArray,
} from '@trezor/device-utils';
import {
    getIntegerInRangeFromString,
    isNotNull,
    removeTrailingSlashes,
    versionUtils,
} from '@trezor/utils';
import type { VersionArray } from '@trezor/utils/src/versionUtils';

import * as firmwareReleaseStore from './firmwareReleaseStore';
import * as localFirmwareStore from './localFirmwareStore';
import * as settingsStore from './settingsStore';
import { getReleaseAsset, getReleasesAssetByDeviceModelAndFirmwareType } from '../utils/assetUtils';
import { httpRequest } from '../utils/assets';
import {
    fetchFirmwareReleaseConfig,
    getOnlineFirmwareBaseUrl,
} from '../utils/firmwareReleaseConfigUtils';
import {
    buildIntermediaryFirmwareFileName,
    buildLocalFirmwareFileName,
    buildLocalReleaseName,
    findBestCompatibleRelease,
    isFirmwareCacheUsedForSelectedSource,
    isProductionFirmwareChannel,
    isStrictFeatures,
} from '../utils/firmwareUtils';

// We use `bundledReleases` to know what are the binaries that are bundled so we do not need to download them if they are needed.
const getBundledFirmwareVersion = (
    deviceModel: DeviceModelInternal,
    firmwareType: FirmwareType,
): string | undefined => {
    const bundledRelease = firmwareReleaseConfigAssets.releases[deviceModel]?.[firmwareType];
    if (!bundledRelease) {
        // Probably this is a new device model.
        return;
    }
    // Extracts the version from the filename, 't2b1-2.6.3-bitcoinonly.json' -> '2.6.3'.
    const bundledVersion = bundledRelease.releasePath.match(/(\d+\.\d+\.\d+)/);
    if (!bundledVersion) {
        throw new Error('Fimrware bundled version was not found.');
    }

    return bundledVersion[0];
};

export const getBundledRelease = (
    deviceModel: DeviceModelInternal,
    firmwareType: FirmwareType,
): FirmwareRelease | undefined => {
    const version = getBundledFirmwareVersion(deviceModel, firmwareType);
    if (!version) {
        // Probably it is a new device model
        return;
    }

    const versionArray = versionUtils.tryParse(version);
    if (!versionArray) {
        throw new Error('There was error parsing bundled release.');
    }

    const fwType = firmwareType === FirmwareType.BitcoinOnly ? 'bitcoinonly' : 'universal';
    const deviceModelLower = deviceModel.toLowerCase();
    const fileName = `${deviceModelLower}-${versionArray.join('.')}-${fwType}`;

    return firmwareAssets?.[deviceModelLower]?.[fwType]?.[fileName] as FirmwareRelease;
};

const getOnlineReleaseByPath = async (releasePath: string) => {
    /*
        Example final URLs for reference:
        - production (default) https://data.trezor.io/firmware/t3t1/universal/t3t1-2.8.10-universal.json
        - test-unsigned https://data.trezor.io/dev/firmware/releases/unsigned/t3t1/universal/t3t1-2.8.10-universal.json
        - test-unsigned-stable https://data.trezor.io/dev/firmware/releases/unsigned-stable/t3t1/universal/t3t1-2.8.10-universal.json
        - localhost-unsigned http://localhost:3000/firmware/unsigned/t3t1/universal/t3t1-2.8.10-universal.json
     */
    const onlineFirmwareBaseUrl = getOnlineFirmwareBaseUrl(settingsStore.get('firmwareChannel'));
    const url = `${onlineFirmwareBaseUrl.BASE_URL}/${releasePath}`;

    const response = await httpRequest(url, 'json', {
        signal: AbortSignal.timeout(10000),
        skipLocalForceDownload: true,
    });

    return response as FirmwareRelease;
};

/**
 * Returns only the path where to find firmware release (at a base URL), based on the current settings.
 * Example: 'firmware/t3t1/universal/t3t1-2.8.10-universal.json'
 */
const getOnlineReleasePath = (
    deviceModel: DeviceModelInternal,
    firmwareVersion: VersionArray,
    firmwareType: FirmwareType,
): string => {
    const { MIDDLE_PATH } = getOnlineFirmwareBaseUrl(settingsStore.get('firmwareChannel'));
    const firmwareTypeFileString =
        firmwareType === FirmwareType.BitcoinOnly ? 'bitcoinonly' : 'universal';

    return `${MIDDLE_PATH}/${deviceModel.toLowerCase()}/${firmwareTypeFileString}/${deviceModel.toLowerCase()}-${firmwareVersion.join('.')}-${firmwareTypeFileString}.json`;
};

export const getOnlineReleaseByVersion = async (
    deviceModel: DeviceModelInternal,
    firmwareVersion: VersionArray,
    firmwareType: FirmwareType,
): Promise<FirmwareRelease | undefined> => {
    const releasePath = getOnlineReleasePath(deviceModel, firmwareVersion, firmwareType);
    const onlineRelease = await getOnlineReleaseByPath(releasePath);
    if (!onlineRelease || !versionUtils.isEqual(onlineRelease.version, firmwareVersion)) {
        return;
    }

    return onlineRelease;
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
    const firmwareChannel = settingsStore.get('firmwareChannel');

    const releaseFromConfig = firmwareReleaseStore.getReleases(
        features.internal_model,
        firmwareType,
    )?.release;
    if (releaseFromConfig && versionUtils.isEqual(firmwareVersion, releaseFromConfig.version)) {
        return releaseFromConfig;
    }

    const releaseName = buildLocalReleaseName(firmwareType, deviceModel, firmwareVersion);

    const { firmwareDir, firmwareList } = localFirmwareStore.get();
    if (
        isFirmwareCacheUsedForSelectedSource(firmwareChannel) &&
        firmwareList.includes(releaseName)
    ) {
        const localReleasePath = `${firmwareDir}${releaseName}`;
        const localReleaseBuffer = await httpRequest(localReleasePath, 'json');

        return JSON.parse(localReleaseBuffer.toString());
    }

    // Bundled assets are production releases, so only use them on production-like channels.
    // On other channels we must fetch the channel-appropriate release from remote.
    const useBundledRelease = isProductionFirmwareChannel(firmwareChannel);

    const release =
        // Order is important!
        (useBundledRelease && getReleaseAsset(deviceModel, firmwareVersion, firmwareType)) ||
        (await getOnlineReleaseByVersion(deviceModel, firmwareVersion, firmwareType).catch(
            () => undefined,
        ));

    // Sanity check to make sure we provide the required release.
    if (release && versionUtils.isEqual(release.version, firmwareVersion)) {
        return release;
    }

    return;
};

// We can build the local firmware release config only using local bundled releases JSON, and we will need to use it
// it is not possible to build the remote one.
export const createLocalFirmwareConfig = (releases: ReleasesConfig) => {
    const releaseEntries = Object.entries(releases)
        .map(([deviceModel, modelReleases]) => {
            const modelKey = deviceModel as DeviceModelInternal;

            if (modelKey === DeviceModelInternal.UNKNOWN) return null;

            const { 'bitcoin-only': btcOnly, universal } = modelReleases ?? {};

            if (!btcOnly?.releasePath || !universal?.releasePath) return null;

            const btcOnlyRelease = getBundledRelease(modelKey, FirmwareType.BitcoinOnly);
            const universalRelease = getBundledRelease(modelKey, FirmwareType.Universal);

            if (!btcOnlyRelease || !universalRelease) return null;

            const newreleases = {
                [FirmwareType.BitcoinOnly]: { ...btcOnly, release: btcOnlyRelease },
                [FirmwareType.Universal]: { ...universal, release: universalRelease },
            };

            return [modelKey, newreleases];
        })
        .filter(isNotNull);

    return Object.fromEntries(releaseEntries);
};

export const createRemoteFirmwareConfig = async (releases: ReleasesConfig) => {
    const releaseEntryPromises = Object.entries(releases).map(
        async ([deviceModel, modelReleases]) => {
            const modelKey = deviceModel as DeviceModelInternal;

            if (modelKey === DeviceModelInternal.UNKNOWN) return null;

            const { 'bitcoin-only': btcOnly, universal } = modelReleases ?? {};

            if (!btcOnly?.releasePath || !universal?.releasePath) return null;

            const [bitcoinOnlyRelease, universalRelease] = await Promise.all([
                getOnlineReleaseByPath(btcOnly.releasePath),
                getOnlineReleaseByPath(universal.releasePath),
            ]);

            if (!universalRelease || !bitcoinOnlyRelease) return null;

            const newreleases = {
                [FirmwareType.BitcoinOnly]: { ...btcOnly, release: bitcoinOnlyRelease },
                [FirmwareType.Universal]: { ...universal, release: universalRelease },
            };

            return [modelKey, newreleases];
        },
    );

    const validEntries = (await Promise.all(releaseEntryPromises)).filter(isNotNull);

    return Object.fromEntries(validEntries);
};

export const initializeFirmwareConfig = async (firmwareChannel?: FirmwareChannel) => {
    const remoteConfig = await fetchFirmwareReleaseConfig(firmwareChannel);

    if (remoteConfig && remoteConfig.sequence > firmwareReleaseConfigAssets.sequence) {
        try {
            const remoteReleases = await createRemoteFirmwareConfig(remoteConfig.releases);

            return {
                releases: remoteReleases,
                intermediaries: remoteConfig.intermediaries,
            };
        } catch {
            // There was an error fetching the remote data for config, we ignore it and use local config.
        }
    }
    // If we reach here, the local config is the same or newer. We use the local one.

    // We had some issue getting remote so we use local data.
    const localReleases = createLocalFirmwareConfig(firmwareReleaseConfigAssets.releases);

    return {
        releases: localReleases,
        intermediaries: firmwareReleaseConfigAssets.intermediaries,
    };
};

export const getLanguage = (languageBinPath: string) => {
    const baseUrl = getOnlineFirmwareBaseUrl(settingsStore.get('firmwareChannel'));
    const url = `${baseUrl.BASE_URL}/${languageBinPath}`;

    return httpRequest(url, 'binary');
};

export type { CurrentVersion } from '@trezor/connect-common/src/types/firmware';

const getCurrentVersion = (features: Features): CurrentVersion => {
    if (!isStrictFeatures(features)) {
        throw new Error('Features of unexpected shape provided.');
    }
    const bootloaderVersion = getBootloaderVersionArray({ features });
    // Old T1B1 versions do not report FW version in bootloader mode, then it cannot be known,
    // but we are handling it `getReleaseInfo` when device is T1B1 we use bootloader version.
    const firmwareVersion = getFirmwareVersionArray({ features });

    return { bootloaderVersion, firmwareVersion };
};

const getIntermediaryMessageRelease = (features: Features) => {
    const { bootloaderVersion, firmwareVersion } = getCurrentVersion(features);

    const currentVersion = features.bootloader_mode ? bootloaderVersion : firmwareVersion;
    const minVersionKey = features.bootloader_mode
        ? 'min_bootloader_version'
        : 'min_firmware_version';

    if (!currentVersion) {
        return undefined;
    }

    // Find the first intermediary release that requires a newer version than the current one.
    return firmwareReleaseStore
        .getIntermediary(features.internal_model)
        ?.find(release => versionUtils.isNewer(release[minVersionKey], currentVersion));
};

const getIsBitcoinOnlyAvailable = (features: Features) =>
    !!firmwareReleaseStore.getReleases(features.internal_model, FirmwareType.BitcoinOnly);

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
        // If deviceId is provided, use the deterministic approach. `rolloutProbability` is a
        // 0..100 percentage compared with `<`, so the bucket count must be 100 (values 0..99) -
        // passing 101 here would bucket one extra value (100) that can never satisfy `< 100`,
        // permanently excluding ~1% of devices from being offered a release at ANY rollout
        // percentage including 100. See the sibling usage in
        // suite-common/message-system/src/experimentUtils.ts for the same pattern done right.
        const deterministicValueToCompare = getIntegerInRangeFromString(deviceId, 100);

        return deterministicValueToCompare < rolloutProbability;
    }
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
        versionUtils.isNewer(r.version, getFirmwareOrBootloaderVersionArray(features)),
    );
};

export const getFirmwareReleaseConfigInfo = (
    features: Features,
    firmwareType: FirmwareType,
): FirmwareReleaseConfigInfo | undefined => {
    const deviceMessageRelease = firmwareReleaseStore.getReleases(
        features.internal_model,
        firmwareType,
    );
    if (!deviceMessageRelease?.release) {
        return;
    }
    const { release: baseRelease, conditions, firmware_type } = deviceMessageRelease;

    const currentVersion = getCurrentVersion(features);
    const inBootloaderMode = features.bootloader_mode && !!currentVersion.bootloaderVersion;

    const versionContext = inBootloaderMode
        ? {
              version: currentVersion.bootloaderVersion!,
              minVersionKey: 'min_bootloader_version' as const,
          }
        : {
              version: currentVersion.firmwareVersion,
              minVersionKey: 'min_firmware_version' as const,
          };

    const isCompatible =
        versionContext.version &&
        versionUtils.isNewerOrEqual(
            versionContext.version,
            baseRelease[versionContext.minVersionKey],
        );

    const releasesOfDevice = getReleasesAssetByDeviceModelAndFirmwareType(
        features.internal_model,
        firmwareType,
    );

    let suitableRelease = baseRelease;
    if (!isCompatible) {
        // If the target isn't compatible, search for the best alternative.
        const alternativeRelease = findBestCompatibleRelease(
            releasesOfDevice,
            currentVersion,
            versionContext.minVersionKey,
        );
        // If an alternative is found, use it. Otherwise, we proceed with the original.
        if (alternativeRelease) {
            suitableRelease = alternativeRelease;
        }
    }

    const intermediary = getIntermediaryMessageRelease(features);
    const release = intermediary ? baseRelease : suitableRelease;

    if (!isStrictFeatures(features)) {
        throw new Error('Features of unexpected shape provided.');
    }
    if (!isValidConditionalRelease(release)) {
        throw new Error(`Release object in unexpected shape.`);
    }
    const { min_firmware_version, min_bootloader_version } = release;

    let isNewer: boolean;
    let requiresIntermediary: boolean;

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

    if (requiresIntermediary && intermediary) {
        isNewer = true;
    }

    return {
        firmwareType: firmware_type,
        isBitcoinOnlyAvailable: getIsBitcoinOnlyAvailable(features),
        releaseConditions: { ...conditions, shouldBeOffered },
        release,
        intermediary: requiresIntermediary ? intermediary : undefined,
        isRequired: getChangelog(releasesOfDevice, features)?.some(item => item.required) ?? null,
        isNewer,
        translations: release.translations,
    };
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

type FirmwareLocationPathParams = {
    baseUrl: string;
    path: string;
};

/**
 * Get firmware location parameters (baseUrl and path) where the firmware binary can be downloaded.
 * The function checks multiple locations in the following order:
 * 1. Bundled firmware location (if the firmware version matches the bundled version).
 * 2. Local firmware directory (if the firmware file exists locally).
 * 3. Online firmware location (default fallback).
 */
export const getFirmwareLocation = ({
    firmwareVersion,
    remotePath,
    deviceModel,
    firmwareType,
    intermediaryVersion,
}: GetFirmwareLocationParam): FirmwareLocationPathParams => {
    const firmwareName = intermediaryVersion
        ? buildIntermediaryFirmwareFileName(deviceModel, intermediaryVersion)
        : buildLocalFirmwareFileName(firmwareType, deviceModel, firmwareVersion);

    const versionString = firmwareVersion.join('.');

    const bundledBaseUrl = removeTrailingSlashes(settingsStore.get('binFilesBaseUrl'));
    // Here we care just to know if the binaries are bundled, in order to use them locally instead of fetching them
    // if they are in default remote we ignore it.
    const isRealBundled = !bundledBaseUrl.includes('data.trezor.io');
    const bundledVersion = getBundledFirmwareVersion(deviceModel, firmwareType);

    const isIntermediary = bundledBaseUrl && intermediaryVersion;
    const isMatchingBundledVersion =
        bundledBaseUrl && isRealBundled && bundledVersion === versionString;

    if (isIntermediary || isMatchingBundledVersion) {
        return {
            baseUrl: bundledBaseUrl,
            path: `firmware/${deviceModel.toLowerCase()}/${firmwareName}`,
        };
    }

    const { firmwareDir, firmwareList } = localFirmwareStore.get();
    if (
        isFirmwareCacheUsedForSelectedSource(settingsStore.get('firmwareChannel')) &&
        firmwareList.includes(firmwareName)
    ) {
        return {
            baseUrl: firmwareDir,
            path: firmwareName,
        };
    }

    const onlineBaseUrl = getOnlineFirmwareBaseUrl(settingsStore.get('firmwareChannel'));

    return {
        baseUrl: onlineBaseUrl.BASE_URL,
        path: remotePath,
    };
};

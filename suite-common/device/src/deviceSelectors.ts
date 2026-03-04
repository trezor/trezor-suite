import { A, pipe } from '@mobily/ts-belt';

import { createWeakMapSelector, returnStableArrayIfEmpty } from '@suite-common/redux-utils';
import {
    BackupType,
    FirmwareRevision,
    LANGUAGES,
    Locale,
    TrezorDevice,
    TrezorDeviceWithState,
} from '@suite-common/suite-types';
import {
    getDeviceInstances,
    getDeviceInstancesGroupedByDeviceId,
    getDeviceInternalModel,
    getFwUpdateVersion,
    getIsDeviceConnectedAndAuthorized,
    getIsDeviceConnectedViaBluetooth,
    getIsDeviceInitialized,
    getIsThpDevice,
    getSortedDevicesWithoutInstances,
    getStatus,
    isDeviceAcquired,
} from '@suite-common/suite-utils';
import { Device, DeviceState, StaticSessionId, asBluetoothDeviceId } from '@trezor/connect';
import {
    DeviceModelInternal,
    FirmwareVersionString,
    getFirmwareRevision,
    getFirmwareVersion,
    getFirmwareVersionArray,
    hasBitcoinOnlyFirmware,
} from '@trezor/device-utils';
import { getSuiteVersion } from '@trezor/env-utils';
import { versionUtils } from '@trezor/utils';

import {
    DEVICE_LOW_BATTERY_PERCENTAGE_THRESHOLD,
    PORTFOLIO_TRACKER_DEVICE_ID,
} from './deviceConstants';
import { DeviceRootState } from './deviceReducer';
import { isTrezorDeviceWithState } from './deviceUtils';
import {
    deviceInvariabilityCheck,
    rawDataToDeviceInvariabilityCheckDTO,
} from './services/deviceInvariabilityCheck';
import { getIsDeviceIdValid } from './services/getIsDeviceIdValid';

const createMemoizedSelector = createWeakMapSelector.withTypes<DeviceRootState>();

export const selectDevices = (state: DeviceRootState) => state.device?.devices;

export const selectDevicesCount = (state: DeviceRootState) => state.device?.devices?.length;

export const selectSelectedDevice = (state: DeviceRootState) => state.device.selectedDevice;

export const selectPersistentDeviceData = (state: DeviceRootState) =>
    state.device.persistentDeviceData;

export const selectPersistentDeviceDataById = createMemoizedSelector(
    [selectPersistentDeviceData, (_state, deviceId: TrezorDevice['id']) => deviceId],
    (persistentDeviceData, deviceId) =>
        persistentDeviceData.find(data => data.device_id === deviceId),
);

export const selectEntropyCheckResultByDeviceId = createMemoizedSelector(
    [selectPersistentDeviceDataById],
    persistentDeviceData => persistentDeviceData?.lastEntropyCheckResult,
);

// Use in tests only! See deviceReducer for the property definition.
export const selectSimulatedEntropyCheckFail = (state: DeviceRootState) =>
    state.device.simulatedEntropyCheckFail;

// Derived selectors
export const selectIsPendingTransportEvent = createMemoizedSelector(
    [selectDevices],
    devices => devices.length < 1,
);

export const selectDeviceAutoconnectCredentials = createMemoizedSelector(
    [selectSelectedDevice],
    device => device?.thp?.credentials.filter(cred => cred.autoconnect) ?? [],
);

export const selectIsDeviceUnlocked = createMemoizedSelector(
    [selectSelectedDevice],
    device => !!device?.features?.unlocked,
);

export const selectDeviceType = createMemoizedSelector(
    [selectSelectedDevice],
    device => device?.type,
);

export const selectDevicePath = createMemoizedSelector(
    [selectSelectedDevice],
    device => device?.path,
);

export const selectDeviceFeatures = createMemoizedSelector(
    [selectSelectedDevice],
    device => device?.features,
);

export const selectDeviceCapabilities = createMemoizedSelector(
    [selectDeviceFeatures],
    features => features?.capabilities,
);

export const selectIsDeviceLanguageConfigurable = createMemoizedSelector(
    [selectDeviceCapabilities],
    capabilities => !!capabilities?.includes('Capability_Translations'),
);

export const selectIsBluetoothSupportedByDevice = createMemoizedSelector(
    [selectDeviceCapabilities],
    capabilities => !!capabilities?.includes('Capability_BLE'),
);

export const selectIsDeviceProtectedByPin = createMemoizedSelector(
    [selectDeviceFeatures],
    features => !!features?.pin_protection,
);

export const selectIsDeviceProtectedByPassphrase = createMemoizedSelector(
    [selectDeviceFeatures],
    features => !!features?.passphrase_protection,
);

export const selectIsDeviceProtectedByWipeCode = createMemoizedSelector(
    [selectDeviceFeatures],
    features => !!features?.wipe_code_protection,
);

export const selectIsDeviceBackedUp = createMemoizedSelector(
    [selectDeviceFeatures],
    features => features?.backup_availability !== 'Required' && !features?.unfinished_backup,
);

export const selectIsDeviceBackupRequired = createMemoizedSelector(
    [selectDeviceFeatures],
    features => features?.backup_availability === 'Required',
);

export const selectIsDeviceBackupUnfinished = createMemoizedSelector(
    [selectDeviceFeatures],
    features => features?.unfinished_backup === true,
);

export const selectDeviceLanguage = createMemoizedSelector(
    [selectDeviceFeatures],
    features => (features?.language as Locale) ?? null,
);

export const selectAvailableDeviceTranslations = createMemoizedSelector(
    [selectSelectedDevice],
    device => device?.availableTranslations ?? {},
);

export const selectSupportedDeviceLanguages = createMemoizedSelector(
    [selectAvailableDeviceTranslations],
    availableDeviceTranslations => {
        const supportedDeviceLanguages = Object.entries(LANGUAGES)
            .filter(([code]) => availableDeviceTranslations[code])
            .map(([code, { icon, name }]) => ({
                value: code as Locale,
                icon,
                label: name,
                isBeta: true, // TODO: This will need tweaking in the future.
            }))
            .sort((a, b) => a.label.localeCompare(b.label));

        const { icon, name } = LANGUAGES['en-US'];
        supportedDeviceLanguages.unshift({
            value: 'en-US',
            icon,
            label: name,
            isBeta: false,
        });

        return supportedDeviceLanguages;
    },
);

export const selectDeviceButtonRequests = createMemoizedSelector(
    [selectSelectedDevice],
    device => device?.buttonRequests ?? [],
);

export const selectDeviceButtonRequestsCodes = createMemoizedSelector(
    [selectDeviceButtonRequests],
    buttonRequests =>
        pipe(
            buttonRequests.map(r => r.code),
            returnStableArrayIfEmpty,
        ),
);

export const selectDeviceMode = createMemoizedSelector(
    [selectSelectedDevice],
    device => device?.mode ?? null,
);

export const selectIsUnacquiredDevice = createMemoizedSelector(
    [selectDeviceType],
    deviceType => deviceType === 'unacquired',
);

export const selectIsDeviceInBootloader = createMemoizedSelector(
    [selectDeviceMode],
    mode => mode === 'bootloader',
);

export const selectIsDeviceInitialized = createMemoizedSelector(
    [selectDeviceFeatures, selectDeviceMode],
    (features, mode) => getIsDeviceInitialized({ deviceMode: mode, deviceFeatures: features }),
);

export const selectIsDeviceConnected = createMemoizedSelector(
    [selectSelectedDevice],
    device => !!device?.connected,
);

export const selectIsDeviceConnectedViaBluetooth = createMemoizedSelector(
    [selectSelectedDevice],
    device => getIsDeviceConnectedViaBluetooth(device),
);

export const selectIsThpDevice = createMemoizedSelector(
    [selectSelectedDevice],
    device => device && getIsThpDevice(device),
);

export const selectIsDeviceConnectedViaBluetoothLowOnBattery = createMemoizedSelector(
    [selectIsDeviceConnectedViaBluetooth, selectDeviceFeatures],
    (isDeviceConnectedViaBluetooth, features) => {
        const { usb_connected, wireless_connected, soc } = features || {};

        // If not connected via Bluetooth, then there is no low battery.
        if (!isDeviceConnectedViaBluetooth) {
            return false;
        }

        // If it is connected via USB or wireless charger, we assume it's charging/fine,
        if (usb_connected || wireless_connected) {
            return false;
        }

        const isBatteryDataValid = typeof soc === 'number';

        if (!isBatteryDataValid) {
            // If we cannot read battery status, we assume the worst.
            return true;
        }

        return soc < DEVICE_LOW_BATTERY_PERCENTAGE_THRESHOLD;
    },
);

export const selectDeviceBluetoothId = createMemoizedSelector([selectSelectedDevice], device =>
    device?.descriptor?.apiType === 'bluetooth' && device.descriptor.id
        ? asBluetoothDeviceId(device.descriptor.id)
        : undefined,
);

export const selectIsConnectedDeviceUninitialized = createMemoizedSelector(
    [selectSelectedDevice, selectIsDeviceInitialized],
    (device, isDeviceInitialized) => device && !isDeviceInitialized,
);

export const selectDeviceState = createMemoizedSelector(
    [selectSelectedDevice],
    device => device?.state,
);

export const selectIsDeviceAuthorized = createMemoizedSelector(
    [selectDeviceState],
    deviceState => !!deviceState,
);

export const selectIsDeviceConnectedAndAuthorized = createMemoizedSelector(
    [selectDeviceState, selectDeviceFeatures],
    (deviceState, deviceFeatures) =>
        getIsDeviceConnectedAndAuthorized({ deviceFeatures, deviceState }),
);

export const selectDeviceInternalModel = createMemoizedSelector(
    [selectSelectedDevice],
    device => device?.features?.internal_model,
);

// Selectors with parameters should use WeakMap memoization
export const selectDeviceByState = createMemoizedSelector(
    [selectDevices, (_state, deviceState: DeviceState | undefined) => deviceState],
    (devices, deviceState) =>
        deviceState
            ? devices.find(d => d.state?.staticSessionId === deviceState.staticSessionId)
            : undefined,
);

export const selectDeviceByStaticSessionId = createMemoizedSelector(
    [selectDevices, (_state, staticSessionId: StaticSessionId) => staticSessionId],
    (devices, staticSessionId) =>
        devices.find(
            (d): d is TrezorDeviceWithState =>
                isTrezorDeviceWithState(d) && d.state?.staticSessionId === staticSessionId,
        ),
);

export const selectDeviceUnavailableCapabilities = createMemoizedSelector(
    [selectSelectedDevice],
    device => device?.unavailableCapabilities,
);

export const selectHasDevicePassphraseEntryCapability = createMemoizedSelector(
    [selectDeviceCapabilities],
    capabilities => !!capabilities?.includes('Capability_PassphraseEntry'),
);

export const selectDeviceStatus = createMemoizedSelector(
    [selectSelectedDevice],
    device => device && getStatus(device),
);

export const selectIsDeviceThpLocked = createMemoizedSelector(
    [selectDeviceStatus],
    deviceStatus => deviceStatus === 'device-thp-locked',
);

export const selectDeviceById = createMemoizedSelector(
    [state => state.device.devices, (_state, deviceId: TrezorDevice['id']) => deviceId],
    (devices, deviceId) => devices.find(device => device.id === deviceId),
);

export const selectSelectedPersistentDeviceData = createMemoizedSelector(
    [selectSelectedDevice, selectPersistentDeviceData],
    (device, persistentDeviceData) => persistentDeviceData.find(d => d.device_id === device?.id),
);

export const selectDeviceAuthenticity = (state: DeviceRootState) => state.device.deviceAuthenticity;

export const selectSelectedDeviceAuthenticity = createMemoizedSelector(
    [selectSelectedDevice, selectDeviceAuthenticity],
    (device, deviceAuthenticity) => (device?.id ? deviceAuthenticity?.[device.id] : undefined),
);

export const selectIsFirmwareAuthenticityCheckDismissed = createMemoizedSelector(
    [selectSelectedDevice, state => state.device.dismissedSecurityChecks?.firmwareAuthenticity],
    (device, dismissedChecks) => !!(device?.id && dismissedChecks?.includes(device.id)),
);

export const selectIsEntropyCheckFailed = createMemoizedSelector(
    [selectSelectedPersistentDeviceData],
    persistentDeviceData => persistentDeviceData?.lastEntropyCheckResult?.success === false,
);

export const selectWasFwHashCheckOtherErrorLastTime = createMemoizedSelector(
    [state => state.device.lastConnectedAuthenticityChecks, selectIsDeviceConnected],
    (lastConnectedAuthenticityChecks, isDeviceConnected) => {
        if (!isDeviceConnected) return false;
        const lastHashCheck = lastConnectedAuthenticityChecks?.firmwareHash;

        return lastHashCheck && !lastHashCheck.success && lastHashCheck.error === 'other-error';
    },
);

export const selectIsDeviceIdCheckSuccess = createMemoizedSelector(
    [selectSelectedDevice],
    device => getIsDeviceIdValid(device) === true,
);

export const selectIsDeviceInvariabilityCheckSuccess = createMemoizedSelector(
    [selectSelectedDevice, selectSelectedPersistentDeviceData],
    (device, previousData) => {
        // just a failsafe in case memoization returned wrong results
        if (device && previousData && device.id !== previousData.device_id) {
            console.error('Device invariability check ID mismatch');

            return true;
        }
        const dto = rawDataToDeviceInvariabilityCheckDTO({ device, previousData });

        return deviceInvariabilityCheck(dto).success;
    },
);

export const selectIsPortfolioTrackerDevice = createMemoizedSelector(
    [selectSelectedDevice],
    device => device?.id === PORTFOLIO_TRACKER_DEVICE_ID,
);

export const selectDeviceLabel = createMemoizedSelector(
    [selectSelectedDevice],
    device => device?.features?.label,
);

export const selectDeviceName = createMemoizedSelector(
    [selectSelectedDevice],
    device => device?.name,
);

export const selectDeviceLabelOrNameById = createMemoizedSelector(
    [state => state.device.devices, (_state, id: TrezorDevice['id']) => id],
    (devices, id) => {
        const device = devices.find(d => d.id === id);

        return device?.features?.label || device?.name || '';
    },
);

export const selectSelectedDeviceLabelOrName = createMemoizedSelector(
    [selectSelectedDevice],
    selectedDevice => selectedDevice?.features?.label || selectedDevice?.name || '',
);

export const selectDeviceId = createMemoizedSelector(
    [selectSelectedDevice],
    selectedDevice => selectedDevice?.id ?? null,
);

export const selectDeviceModelById = createMemoizedSelector(
    [state => state.device.devices, (_state, id: TrezorDevice['id']) => id],
    (devices, id) => {
        const device = devices.find(d => d.id === id);

        return device?.features?.internal_model ?? null;
    },
);

export const selectDeviceModel = createMemoizedSelector([selectSelectedDevice], selectedDevice =>
    selectedDevice ? getDeviceInternalModel(selectedDevice) : null,
);

export const selectFirmwareReleaseConfig = createMemoizedSelector(
    [selectSelectedDevice],
    device => device?.firmwareReleaseConfigInfo ?? null,
);

export const selectIsFirmwareUpgradable = createMemoizedSelector(
    [selectFirmwareReleaseConfig],
    deviceReleaseInfo => deviceReleaseInfo?.isNewer ?? false,
);

export const selectDeviceFirmwareVersion = createMemoizedSelector([selectSelectedDevice], device =>
    getFirmwareVersion(device),
);

export const selectDeviceFirmwareVersionArray = createMemoizedSelector(
    [selectSelectedDevice],
    device => getFirmwareVersionArray(device),
);

// Selects all wallets of all physical devices. See `selectPhysicalDevicesGrouppedById` for grouping by the same device.
export const selectPhysicalDeviceWallets = createMemoizedSelector([selectDevices], devices =>
    pipe(
        devices,
        A.filter(device => device.id !== PORTFOLIO_TRACKER_DEVICE_ID),
        returnStableArrayIfEmpty,
    ),
);

export const selectIsNoPhysicalDeviceConnected = createMemoizedSelector(
    [selectPhysicalDeviceWallets],
    devices => devices.every(device => !device.connected),
);

export const selectIsAnyPhysicalDeviceConnectedViaUsb = createMemoizedSelector(
    [selectPhysicalDeviceWallets],
    devices => devices.some(device => device.connected && device.descriptor.apiType === 'usb'),
);

export const selectHasOnlyPortfolioDevice = createMemoizedSelector(
    [selectDevices],
    devices => devices.length === 1 && devices[0].id === PORTFOLIO_TRACKER_DEVICE_ID,
);

export const selectHasDeviceFirmwareInstalled = createMemoizedSelector(
    [selectSelectedDevice],
    device => !!device && device.firmware !== 'none',
);

export const selectIsDeviceRemembered = createMemoizedSelector(
    [selectSelectedDevice],
    device => !!device?.remember,
);

export const selectRememberedStandardWallets = createMemoizedSelector(
    [selectPhysicalDeviceWallets],
    devices =>
        returnStableArrayIfEmpty(
            devices.filter(device => device.remember && device.useEmptyPassphrase === true),
        ),
);

export const selectRememberedStandardWalletsCount = createMemoizedSelector(
    [selectRememberedStandardWallets],
    wallets => wallets.length,
);

export const selectRememberedHiddenWallets = createMemoizedSelector(
    [selectPhysicalDeviceWallets],
    devices =>
        returnStableArrayIfEmpty(
            devices.filter(device => device.remember && device.useEmptyPassphrase === false),
        ),
);

export const selectRememberedHiddenWalletsCount = createMemoizedSelector(
    [selectRememberedHiddenWallets],
    wallets => wallets.length,
);

export const selectIsDeviceInViewOnlyMode = createMemoizedSelector(
    [selectIsDeviceConnected, selectIsDeviceRemembered],
    (isDeviceConnected, isDeviceRemembered) => !isDeviceConnected && isDeviceRemembered,
);

export const selectIsDeviceUsingPassphrase = createMemoizedSelector(
    [selectIsDeviceProtectedByPassphrase, selectSelectedDevice],
    (isDeviceProtectedByPassphrase, device) => {
        const shouldTreatAsPassphraseProtected = (device?.instance ?? 1) > 1;

        return (
            (isDeviceProtectedByPassphrase && device?.useEmptyPassphrase === false) ||
            shouldTreatAsPassphraseProtected
        );
    },
);

// Selects all physical devices wallets grouped per device
export const selectPhysicalDevicesGrouppedById = createMemoizedSelector(
    [selectPhysicalDeviceWallets],
    devices => returnStableArrayIfEmpty(getDeviceInstancesGroupedByDeviceId(devices)),
);

export const selectDeviceStaticSessionId = createMemoizedSelector(
    [selectSelectedDevice],
    device => device?.state?.staticSessionId ?? null,
);

export const selectDeviceInstances = createMemoizedSelector(
    [selectSelectedDevice, selectDevices],
    (device, allDevices) => {
        if (!device) {
            return [];
        }

        return pipe(getDeviceInstances(device, allDevices), returnStableArrayIfEmpty);
    },
);

export const selectNumberOfDeviceInstances = createMemoizedSelector(
    [selectDeviceInstances],
    deviceInstances => deviceInstances.length,
);

export const selectInstacelessUnselectedDevices = createMemoizedSelector(
    [selectSelectedDevice, selectDevices],
    (device, allDevices) =>
        pipe(getSortedDevicesWithoutInstances(allDevices, device?.id), returnStableArrayIfEmpty),
);

export const selectHasBitcoinOnlyFirmware = createMemoizedSelector([selectSelectedDevice], device =>
    hasBitcoinOnlyFirmware(device),
);

export const selectShouldOfferUpdateFirmware = createMemoizedSelector(
    [selectFirmwareReleaseConfig],
    firmwareReleaseConfig => {
        if (!firmwareReleaseConfig) return false;
        const { releaseConditions } = firmwareReleaseConfig;
        const { environment } = releaseConditions;
        const isValidSuiteNativeVersion = environment?.min_suite_native_version
            ? versionUtils.isNewerOrEqual(getSuiteVersion(), environment?.min_suite_native_version)
            : false;

        return (
            firmwareReleaseConfig?.isNewer &&
            isValidSuiteNativeVersion &&
            releaseConditions.shouldBeOffered
        );
    },
);

export const selectDeviceUpdateFirmwareVersion = (state: DeviceRootState) => {
    const device = selectSelectedDevice(state);

    return device ? getFwUpdateVersion(device) : null;
};

export const selectFirmwareChangelog = (state: DeviceRootState) => {
    const device = selectSelectedDevice(state);
    const isBitcoinOnlyFirmware = selectHasBitcoinOnlyFirmware(state);

    if (isBitcoinOnlyFirmware) {
        return device?.firmwareReleaseConfigInfo?.release.changelog;
    }

    return device?.firmwareReleaseConfigInfo?.release.changelog;
};

export const selectDeviceUnitPackaging = createMemoizedSelector(
    [selectDeviceFeatures],
    features => features?.unit_packaging ?? 0,
);

const defaultBackupTypeMap: Record<DeviceModelInternal, BackupType> = {
    [DeviceModelInternal.UNKNOWN]: '12-words', // just to have something
    [DeviceModelInternal.T1B1]: '24-words',
    [DeviceModelInternal.T2T1]: '12-words',
    [DeviceModelInternal.T2B1]: 'shamir-single',
    [DeviceModelInternal.T3B1]: 'shamir-single',
    [DeviceModelInternal.T3T1]: 'shamir-single',
    [DeviceModelInternal.T3W1]: 'shamir-single',
};

export const selectDeviceDefaultBackupType = createMemoizedSelector(
    [selectDeviceModel, selectDeviceUnitPackaging],
    (deviceModel, deviceUnitPackaging) => {
        // Original package of Trezor Safe 3 has a card with just 12 words.
        if (deviceModel === DeviceModelInternal.T2B1 && deviceUnitPackaging === 0) {
            return '12-words';
        }

        return deviceModel ? defaultBackupTypeMap[deviceModel] : 'shamir-single';
    },
);

export const selectIsSameOrNewDevice = createMemoizedSelector(
    [selectSelectedDevice, (_state, device: Device | TrezorDevice | undefined) => device],
    (selectedDevice, device) => selectedDevice === undefined || device?.id === selectedDevice.id,
);

export const selectDeviceFirmwareRevision = createMemoizedSelector([selectSelectedDevice], device =>
    getFirmwareRevision(device),
);

/**
 * Get firmware revision check error, or null if check was successful / skipped.
 */
export const selectFirmwareRevisionCheckError = (state: DeviceRootState) => {
    const device = selectSelectedDevice(state);
    if (!isDeviceAcquired(device) || !device.authenticityChecks) return null;
    const checkResult = device.authenticityChecks.firmwareRevision;

    // null means not performed, then don't consider it failed
    if (!checkResult || checkResult.success) return null;

    return checkResult.error;
};

/**
 * Get firmware hash check error, or null if check was successful / skipped.
 */
export const selectFirmwareHashCheckError = (state: DeviceRootState) => {
    const device = selectSelectedDevice(state);
    if (!isDeviceAcquired(device) || !device.authenticityChecks) return null;
    const checkResult = device.authenticityChecks.firmwareHash;

    // null means not performed, then don't consider it failed
    if (!checkResult || checkResult.success) return null;

    return checkResult.error;
};

export const selectIsDevicePinLocked = createMemoizedSelector(
    [selectSelectedDevice],
    selectedDevice => selectedDevice && getStatus(selectedDevice) === 'device-pin-locked',
);

export const selectAllDeviceStaticIds = createMemoizedSelector([selectDevices], devices =>
    devices.reduce<StaticSessionId[]>((acc, it) => {
        if (it.state?.staticSessionId !== undefined) {
            acc.push(it.state?.staticSessionId);
        }

        return acc;
    }, []),
);

export const selectDeviceDelegatedIdentityKey = createMemoizedSelector(
    [selectPersistentDeviceData, (_state, deviceId: string) => deviceId],
    (persistentDeviceData, deviceId) =>
        persistentDeviceData.find(d => d.device_id === deviceId)?.delegatedIdentityKey ?? null,
);

type DeviceUtmParams = {
    utm_model?: DeviceModelInternal;
    utm_fw?: FirmwareVersionString;
    utm_rev?: FirmwareRevision;
    utm_passphrase?: 'true' | 'false';
};

export const selectSupportChatDeviceUtmParams = createMemoizedSelector(
    [
        selectDeviceInternalModel,
        selectDeviceFirmwareVersion,
        selectDeviceFirmwareRevision,
        selectIsDeviceUsingPassphrase,
        selectIsPortfolioTrackerDevice,
    ],
    (
        deviceModel,
        firmwareVersion,
        firmwareRevision,
        isDeviceUsingPassphrase,
        isPortfolioTrackerDevice,
    ) => {
        const result: DeviceUtmParams = {};

        if (isPortfolioTrackerDevice) {
            return result;
        }

        if (deviceModel) {
            result.utm_model = deviceModel;
        }

        if (firmwareVersion) {
            result.utm_fw = firmwareVersion;
        }

        if (firmwareRevision) {
            result.utm_rev = firmwareRevision;
        }

        if (isDeviceUsingPassphrase) {
            result.utm_passphrase = isDeviceUsingPassphrase ? 'true' : 'false';
        }

        return result;
    },
);

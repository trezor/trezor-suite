import { A, pipe } from '@mobily/ts-belt';

import { createWeakMapSelector, returnStableArrayIfEmpty } from '@suite-common/redux-utils';
import { BackupType, TrezorDevice } from '@suite-common/suite-types';
import * as deviceUtils from '@suite-common/suite-utils';
import { getDeviceInstances, getFwUpdateVersion, getStatus } from '@suite-common/suite-utils';
import { networkSymbolCollection } from '@suite-common/wallet-config';
import { DeviceState, StaticSessionId } from '@trezor/connect';
import {
    DeviceModelInternal,
    getFirmwareVersion,
    getFirmwareVersionArray,
    hasBitcoinOnlyFirmware,
} from '@trezor/device-utils';

import { PORTFOLIO_TRACKER_DEVICE_ID } from './deviceConstants';
import { DeviceRootState } from './deviceReducer';

const createMemoizedSelector = createWeakMapSelector.withTypes<DeviceRootState>();

export const selectDevices = (state: DeviceRootState) => state.device?.devices;
export const selectDevicesCount = (state: DeviceRootState) => state.device?.devices?.length;
export const selectSelectedDevice = (state: DeviceRootState) => state.device.selectedDevice;

// Derived selectors
export const selectIsPendingTransportEvent = createMemoizedSelector(
    [selectDevices],
    devices => devices.length < 1,
);

export const selectIsDeviceUnlocked = createMemoizedSelector(
    [selectSelectedDevice],
    device => !!device?.features?.unlocked,
);

export const selectDeviceAuthFailed = createMemoizedSelector(
    [selectSelectedDevice],
    device => !!device?.authFailed,
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
    features => features?.unfinished_backup,
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
    (features, mode) => {
        if (mode === 'initialize' || mode === 'seedless') return false;

        return !!features?.initialized;
    },
);

export const selectIsDeviceConnected = createMemoizedSelector(
    [selectSelectedDevice],
    device => !!device?.connected,
);

export const selectIsDeviceConnectedViaBluetooth = createMemoizedSelector(
    [selectSelectedDevice],
    device => !!device?.bluetoothProps,
);

export const selectDeviceBluetoothId = createMemoizedSelector(
    [selectSelectedDevice],
    device => device?.bluetoothProps?.id,
);

export const selectIsConnectedDeviceUninitialized = createMemoizedSelector(
    [selectSelectedDevice, selectIsDeviceInitialized],
    (device, isDeviceInitialized) => device && !isDeviceInitialized,
);

export const selectIsDeviceAuthorized = createMemoizedSelector(
    [selectSelectedDevice],
    device => !!device?.state,
);

export const selectIsDeviceConnectedAndAuthorized = createMemoizedSelector(
    [selectIsDeviceAuthorized, selectDeviceFeatures],
    (isDeviceAuthorized, deviceFeatures) => isDeviceAuthorized && !!deviceFeatures,
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
    (devices, staticSessionId) => devices.find(d => d.state?.staticSessionId === staticSessionId),
);

export const selectDeviceByBaseStaticSessionId = createMemoizedSelector(
    [selectDevices, (_state, staticSessionId: StaticSessionId) => staticSessionId],
    (devices, staticSessionId) =>
        devices.find(
            d => d.state?.staticSessionId?.split(':')[0] === staticSessionId.split(':')[0],
        ),
);

export const selectDeviceUnavailableCapabilities = createMemoizedSelector(
    [selectSelectedDevice],
    device => device?.unavailableCapabilities,
);

export const selectDeviceCapabilities = createMemoizedSelector(
    [selectDeviceFeatures],
    features => features?.capabilities,
);

export const selectHasDevicePassphraseEntryCapability = createMemoizedSelector(
    [selectDeviceCapabilities],
    capabilities => !!capabilities?.includes('Capability_PassphraseEntry'),
);

export const selectDeviceStatus = createMemoizedSelector(
    [selectSelectedDevice],
    device => device && getStatus(device),
);

export const selectSupportedNetworkByDevice = (device: TrezorDevice | undefined) => {
    const firmwareVersion = getFirmwareVersion(device);
    const result = networkSymbolCollection.filter(symbol => {
        const unavailableCapability = device?.unavailableCapabilities?.[symbol];
        // if device does not have fw, do not show coins which are not supported by device in any case
        if (!firmwareVersion && unavailableCapability === 'no-support') {
            return false;
        }
        // if device has fw, do not show coins which are not supported by current fw
        if (
            firmwareVersion &&
            ['no-support', 'no-capability'].includes(unavailableCapability || '')
        ) {
            return false;
        }

        return true;
    });

    return returnStableArrayIfEmpty(result);
};

export const selectDeviceSupportedNetworks = createMemoizedSelector(
    [selectSelectedDevice],
    selectSupportedNetworkByDevice,
);

export const selectDeviceById = createMemoizedSelector(
    [state => state.device.devices, (_state, deviceId: TrezorDevice['id']) => deviceId],
    (devices, deviceId) => devices.find(device => device.id === deviceId),
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
    [selectSelectedDevice, state => state.device.devicesWithFailedEntropyCheck],
    (device, devicesWithFailedEntropyCheck) =>
        !!(device?.id && devicesWithFailedEntropyCheck?.includes(device.id)),
);

export const selectWasFwHashCheckOtherErrorLastTime = createMemoizedSelector(
    [state => state.device.lastConnectedAuthenticityChecks, selectIsDeviceConnected],
    (lastConnectedAuthenticityChecks, isDeviceConnected) => {
        if (!isDeviceConnected) return false;
        const lastHashCheck = lastConnectedAuthenticityChecks?.firmwareHash;

        return lastHashCheck && !lastHashCheck.success && lastHashCheck.error === 'other-error';
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

export const selectDeviceModel = createMemoizedSelector(
    [selectSelectedDevice],
    selectedDevice => selectedDevice?.features?.internal_model ?? null,
);

export const selectDeviceReleaseInfo = createMemoizedSelector(
    [selectSelectedDevice],
    device => device?.firmwareRelease ?? null,
);

export const selectDeviceFirmwareVersion = createMemoizedSelector([selectSelectedDevice], device =>
    getFirmwareVersionArray(device),
);

export const selectPhysicalDevices = createMemoizedSelector([selectDevices], devices =>
    pipe(
        devices,
        A.filter(device => device.id !== PORTFOLIO_TRACKER_DEVICE_ID),
        returnStableArrayIfEmpty,
    ),
);

export const selectIsNoPhysicalDeviceConnected = createMemoizedSelector(
    [selectPhysicalDevices],
    devices => devices.every(device => !device.connected),
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

export const selectIsDeviceForceRemembered = createMemoizedSelector(
    [selectSelectedDevice],
    device => !!device?.forceRemember,
);

export const selectRememberedStandardWalletsCount = createMemoizedSelector(
    [selectPhysicalDevices],
    devices =>
        returnStableArrayIfEmpty(
            devices.filter(device => device.remember && device.useEmptyPassphrase),
        ).length,
);

export const selectRememberedHiddenWalletsCount = createMemoizedSelector(
    [selectPhysicalDevices],
    devices =>
        returnStableArrayIfEmpty(
            devices.filter(device => device.remember && !device.useEmptyPassphrase),
        ).length,
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

export const selectPhysicalDevicesGrouppedById = createMemoizedSelector(
    [selectPhysicalDevices],
    devices => returnStableArrayIfEmpty(deviceUtils.getDeviceInstancesGroupedByDeviceId(devices)),
);

export const selectDeviceState = createMemoizedSelector(
    [selectSelectedDevice],
    device => device?.state ?? null,
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
        pipe(
            deviceUtils.getSortedDevicesWithoutInstances(allDevices, device?.id),
            returnStableArrayIfEmpty,
        ),
);

export const selectHasBitcoinOnlyFirmware = createMemoizedSelector([selectSelectedDevice], device =>
    hasBitcoinOnlyFirmware(device),
);

export const selectDeviceUpdateFirmwareVersion = (state: DeviceRootState) => {
    const device = selectSelectedDevice(state);

    return device ? getFwUpdateVersion(device) : null;
};

export const selectIsLatestFirmwareInstalled = createMemoizedSelector(
    [selectDeviceFirmwareVersion, selectDeviceUpdateFirmwareVersion],
    (deviceFirmwareVersion, updateFirmwareVersion) =>
        deviceFirmwareVersion?.join('.') === updateFirmwareVersion,
);

export const selectFirmwareChangelog = (state: DeviceRootState) => {
    const device = selectSelectedDevice(state);
    const isBitcoinOnlyFirmware = selectHasBitcoinOnlyFirmware(state);

    if (isBitcoinOnlyFirmware) {
        return device?.firmwareRelease?.changelog?.[0]?.changelog_bitcoinonly;
    }

    return device?.firmwareRelease?.changelog?.[0]?.changelog;
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

import {
    AccountsRootState,
    DeviceRootState,
    DiscoveryRootState,
    selectDeviceFirmwareVersion,
    selectDeviceModel,
    selectIsConnectedDeviceUninitialized,
    selectIsDeviceConnectedAndAuthorized,
    selectIsDeviceDiscoveryEmpty,
    selectIsUnacquiredDevice,
} from '@suite-common/wallet-core';

import { isFirmwareVersionSupported } from './utils';

export const selectIsDeviceFirmwareSupported = (state: DeviceRootState) => {
    const deviceFwVersion = selectDeviceFirmwareVersion(state);
    const deviceModel = selectDeviceModel(state);

    return isFirmwareVersionSupported(deviceFwVersion, deviceModel);
};

export const selectIsDeviceReadyToUse = (
    state: DeviceRootState & AccountsRootState & DiscoveryRootState,
) => {
    const isUnacquiredDevice = selectIsUnacquiredDevice(state);
    const isDeviceFirmwareSupported = selectIsDeviceFirmwareSupported(state);
    const isDeviceUninitialized = selectIsConnectedDeviceUninitialized(state);

    return !isUnacquiredDevice && !isDeviceUninitialized && isDeviceFirmwareSupported;
};

export const selectIsDeviceReadyToUseAndAuthorized = (
    state: DeviceRootState & AccountsRootState & DiscoveryRootState,
) => {
    const isDeviceReadyToUse = selectIsDeviceReadyToUse(state);
    const isDeviceConnectedAndAuthorized = selectIsDeviceConnectedAndAuthorized(state);
    const isDeviceDiscoveryEmpty = selectIsDeviceDiscoveryEmpty(state);

    return isDeviceReadyToUse && isDeviceConnectedAndAuthorized && !isDeviceDiscoveryEmpty;
};

import { memoizeWithArgs } from 'proxy-memoize';

import {
    AccountsRootState,
    DeviceRootState,
    DiscoveryRootState,
    selectDevice,
    FiatRatesRootState,
    selectAccountsByDeviceState,
    selectCurrentFiatRates,
    selectDeviceFirmwareVersion,
    selectDeviceModel,
    selectIsConnectedDeviceUninitialized,
    selectIsDeviceConnectedAndAuthorized,
    selectIsEmptyDevice,
    selectIsUnacquiredDevice,
} from '@suite-common/wallet-core';
import { SettingsSliceRootState, selectFiatCurrencyCode } from '@suite-native/settings';
import { getTotalFiatBalance } from '@suite-common/wallet-utils';

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
    const isEmptyDevice = selectIsEmptyDevice(state);

    return isDeviceReadyToUse && isDeviceConnectedAndAuthorized && !isEmptyDevice;
};

export const selectDeviceError = (
    state: DeviceRootState & AccountsRootState & DiscoveryRootState,
) => {
    const device = selectDevice(state);

    return device?.error;
};

export const selectDeviceTotalFiatBalanceNative = memoizeWithArgs(
    (
        state: AccountsRootState & FiatRatesRootState & SettingsSliceRootState,
        deviceState: string,
    ) => {
        const accounts = deviceState ? selectAccountsByDeviceState(state, deviceState) : [];
        const rates = selectCurrentFiatRates(state);

        const fiatBalance = getTotalFiatBalance(accounts, selectFiatCurrencyCode(state), rates);

        return fiatBalance;
    },
    {
        // reasonably high cache size for a lot of devices and passphrases
        size: 20,
    },
);

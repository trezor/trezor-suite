import { A, pipe } from '@mobily/ts-belt';

import { createWeakMapSelector, returnStableArrayIfEmpty } from '@suite-common/redux-utils';
import {
    AccountsRootState,
    DeviceRootState,
    DiscoveryRootState,
    FiatRatesRootState,
    getAccountsByDeviceState,
    PORTFOLIO_TRACKER_DEVICE_ID,
    selectAccounts,
    selectAccountsByDeviceState,
    selectCurrentFiatRates,
    selectDevice,
    selectDeviceFirmwareVersion,
    selectDeviceInstances,
    selectDeviceModel,
    selectDevices,
    selectIsConnectedDeviceUninitialized,
    selectIsDeviceConnectedAndAuthorized,
    selectIsDiscoveredDeviceAccountless,
    selectIsUnacquiredDevice,
} from '@suite-common/wallet-core';
import { getTotalFiatBalance } from '@suite-common/wallet-utils';
import { selectFiatCurrencyCode, SettingsSliceRootState } from '@suite-native/settings';

import { isFirmwareVersionSupported } from './utils';

type NativeDeviceRootState = DeviceRootState &
    AccountsRootState &
    DiscoveryRootState &
    SettingsSliceRootState &
    FiatRatesRootState;

const createMemoizedSelector = createWeakMapSelector.withTypes<NativeDeviceRootState>();

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
    const isDiscoveredDeviceAccountless = selectIsDiscoveredDeviceAccountless(state);

    return isDeviceReadyToUse && isDeviceConnectedAndAuthorized && !isDiscoveredDeviceAccountless;
};

export const selectDeviceError = (
    state: DeviceRootState & AccountsRootState & DiscoveryRootState,
) => {
    const device = selectDevice(state);

    return device?.error;
};

export const selectDeviceTotalFiatBalanceNative = createMemoizedSelector(
    [selectAccountsByDeviceState, selectCurrentFiatRates, selectFiatCurrencyCode],
    (deviceAccounts, rates, localCurrency) => {
        const fiatBalance = getTotalFiatBalance({
            deviceAccounts,
            localCurrency,
            rates,
            shouldIncludeStaking: false,
        });

        return fiatBalance;
    },
);

// Unique symbols for all accounts that are on view only devices (excluding portfolio tracker)
// Using WeakMap for complex object comparisons and array results
export const selectViewOnlyDevicesAccountsNetworkSymbols = createMemoizedSelector(
    [selectDevices, selectAccounts],
    (devices, accounts) => {
        const symbols = pipe(
            devices,
            A.filter(d => !!d.remember && d.id !== PORTFOLIO_TRACKER_DEVICE_ID && !!d.state),
            A.map(d => getAccountsByDeviceState(accounts, d.state!)),
            A.flat,
            A.filter(a => a.visible),
            A.map(a => a.symbol),
            A.uniq,
        );

        return returnStableArrayIfEmpty(symbols);
    },
);

export const selectHasNoDeviceWithEmptyPassphrase = createMemoizedSelector(
    [selectDeviceInstances],
    deviceInstances => A.isEmpty(deviceInstances.filter(d => d.useEmptyPassphrase)),
);

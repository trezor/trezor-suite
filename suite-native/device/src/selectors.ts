import { memoize, memoizeWithArgs } from 'proxy-memoize';
import { pipe, A, F } from '@mobily/ts-belt';

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
    selectIsDiscoveredDeviceAccountless,
    selectIsUnacquiredDevice,
    PORTFOLIO_TRACKER_DEVICE_ID,
    selectDevices,
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
    const isDiscoveredDeviceAccountless = selectIsDiscoveredDeviceAccountless(state);

    return isDeviceReadyToUse && isDeviceConnectedAndAuthorized && !isDiscoveredDeviceAccountless;
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
        const deviceAccounts = deviceState ? selectAccountsByDeviceState(state, deviceState) : [];
        const rates = selectCurrentFiatRates(state);

        const fiatBalance = getTotalFiatBalance({
            deviceAccounts,
            localCurrency: selectFiatCurrencyCode(state),
            rates,
            shouldIncludeStaking: false,
        });

        return fiatBalance;
    },
    {
        // reasonably high cache size for a lot of devices and passphrases
        size: 20,
    },
);

// Unique symbols for all accounts that are on view only devices (excluding portfolio tracker)
export const selectViewOnlyDevicesAccountsNetworkSymbols = memoize(
    (state: DeviceRootState & AccountsRootState) => {
        const devices = selectDevices(state);

        return pipe(
            devices,
            A.filter(d => !!d.remember && d.id !== PORTFOLIO_TRACKER_DEVICE_ID && !!d.state),
            A.map(d => selectAccountsByDeviceState(state, d.state!)),
            A.flat,
            A.filter(a => a.visible),
            A.map(a => a.symbol),
            A.uniq,
            F.toMutable,
        );
    },
);

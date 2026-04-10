import { A, pipe } from '@mobily/ts-belt';

import {
    type DeviceRootState,
    PORTFOLIO_TRACKER_DEVICE_ID,
    getIsDeviceIdValid,
    selectDeviceAuthenticityByDeviceId,
    selectDeviceFirmwareVersionArray,
    selectDeviceInstances,
    selectDeviceModel,
    selectDevices,
    selectHasDeviceFirmwareInstalled,
    selectIsConnectedDeviceUninitialized,
    selectIsDeviceConnected,
    selectIsDeviceConnectedAndAuthorized,
    selectIsDeviceInBootloader,
    selectIsDeviceInvariabilityCheckSuccess,
    selectIsDeviceThpLocked,
    selectIsEntropyCheckFailed,
    selectIsFirmwareAuthenticityCheckDismissed,
    selectIsUnacquiredDevice,
    selectSelectedDevice,
} from '@suite-common/device';
import {
    getFirmwareAuthenticityCheckErrors,
    getIsHardRevisionCheckError,
} from '@suite-common/firmware-authenticity';
import {
    Feature,
    type MessageSystemRootState,
    selectIsFeatureEnabled,
} from '@suite-common/message-system';
import { createWeakMapSelector, returnStableArrayIfEmpty } from '@suite-common/redux-utils';
import { type ThpRootState, selectThpAutoconnectStep } from '@suite-common/thp';
import {
    type AccountsRootState,
    type DiscoveryRootState,
    type FiatRatesRootState,
    type WalletSettingsRootState,
    getAccountsByDeviceState,
    selectAccounts,
    selectAccountsByDeviceState,
    selectBaseCurrency,
    selectCurrentFiatRates,
    selectDeviceAccounts,
    selectHasRunningDiscovery,
    selectIsDiscoveredDeviceAccountless,
} from '@suite-common/wallet-core';
import {
    type Account,
    type BaseCurrencyAmount,
    type RatesByKey,
    asBaseCurrencyAmount,
} from '@suite-common/wallet-types';
import { getAccountFiatBalance } from '@suite-common/wallet-utils';
import { type DeviceOnboardingSliceRootState } from '@suite-native/device-onboarding';
import { type FeatureFlagsRootState } from '@suite-native/feature-flags';
import { type NativeFirmwareRootState } from '@suite-native/firmware';
import {
    type SettingsSliceRootState,
    selectAreDeviceMetaChecksEnabled,
    selectIsDeviceAuthenticityCheckEnabled,
    selectIsFirmwareRevisionCheckEnabled,
} from '@suite-native/settings';
import { doesCoinSupportStaking } from '@suite-native/staking';
import type { BaseCurrencyCode } from '@trezor/blockchain-link-types';
import { type Device } from '@trezor/connect';
import { BigNumber, isNotNullOrUndefined } from '@trezor/utils';

import { getIsDeviceSetupSupported, isFirmwareVersionSupported } from './utils';

export type NativeDeviceRootState = DeviceRootState &
    ThpRootState &
    AccountsRootState &
    DiscoveryRootState &
    SettingsSliceRootState &
    WalletSettingsRootState &
    FiatRatesRootState &
    FeatureFlagsRootState &
    NativeFirmwareRootState &
    MessageSystemRootState &
    DeviceOnboardingSliceRootState;

const createMemoizedSelector = createWeakMapSelector.withTypes<NativeDeviceRootState>();

export const selectIsDeviceFirmwareSupported = (state: DeviceRootState) => {
    const deviceFwVersion = selectDeviceFirmwareVersionArray(state);
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

export const selectIsDeviceConnectedAndThpUnlocked = createMemoizedSelector(
    [selectIsDeviceConnected, selectIsDeviceThpLocked, selectThpAutoconnectStep],
    (isDeviceConnected, isDeviceThpLocked, thpAutoconnectStep) =>
        isDeviceConnected && !isDeviceThpLocked && thpAutoconnectStep === null,
);

export const selectDeviceError = (
    state: DeviceRootState & AccountsRootState & DiscoveryRootState,
) => {
    const device = selectSelectedDevice(state);

    return device?.error;
};

type GetTotalFiatBalanceNativeParams = {
    deviceAccounts: Account[];
    localCurrency: BaseCurrencyCode;
    rates?: RatesByKey;
};

// FIXME: this function can be removed and substituted with @suite-common/wallet-utils/getTotalFiatBalance when Solana supports staking on mobile.
const getTotalFiatBalanceNative = ({
    deviceAccounts,
    localCurrency,
    rates,
}: GetTotalFiatBalanceNativeParams): BaseCurrencyAmount => {
    let instanceBalance = new BigNumber(0);
    deviceAccounts.forEach(a => {
        const accountFiatBalance =
            getAccountFiatBalance({
                account: a,
                baseCurrencyCode: localCurrency,
                rates,
                shouldIncludeStaking: doesCoinSupportStaking(a.symbol),
            }) ?? '0';
        instanceBalance = instanceBalance.plus(accountFiatBalance);
    });

    return asBaseCurrencyAmount(instanceBalance);
};

export const selectSelectedDeviceTotalFiatBalance = createMemoizedSelector(
    [selectDeviceAccounts, selectCurrentFiatRates, selectBaseCurrency, selectHasRunningDiscovery],
    (deviceAccounts, rates, localCurrency, hasRunningDiscovery) =>
        // do not return any value before discovery is finished to prevent unnecessary rerenders of portfolio graph.
        hasRunningDiscovery
            ? undefined
            : getTotalFiatBalanceNative({ deviceAccounts, localCurrency, rates }),
);

export const selectDeviceTotalFiatBalanceByDeviceState = createMemoizedSelector(
    [selectAccountsByDeviceState, selectCurrentFiatRates, selectBaseCurrency],
    (deviceAccounts, rates, localCurrency) =>
        getTotalFiatBalanceNative({ deviceAccounts, localCurrency, rates }),
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

type FwAuthenticityCheckState = NativeDeviceRootState &
    FeatureFlagsRootState &
    MessageSystemRootState;
/**
 * Get firmware revision check error, or null if check was successful / skipped, if the check is enabled in settings and through message system.
 */
export const selectFirmwareRevisionCheckErrorIfEnabled = (
    state: FwAuthenticityCheckState,
    device: Device,
) => {
    const { revisionCheckError } = getFirmwareAuthenticityCheckErrors(device);
    const isFirmwareRevisionCheckEnabled = selectIsFirmwareRevisionCheckEnabled(state);
    const isMessageSystemFeatureEnabled = selectIsFeatureEnabled(
        state,
        Feature.firmwareRevisionCheckMobile,
        true,
    );
    const isCheckEnabled = isFirmwareRevisionCheckEnabled && isMessageSystemFeatureEnabled;

    return isCheckEnabled ? revisionCheckError : null;
};
export const selectSelectedDeviceFirmwareRevisionCheckErrorIfEnabled = (
    state: FwAuthenticityCheckState,
) => {
    const device = selectSelectedDevice(state);
    if (!device) return null;

    return selectFirmwareRevisionCheckErrorIfEnabled(state, device);
};

/**
 * Determine if either of firmware authenticity checks is considered as hard failure (in order to restrict interaction with device).
 */
export const selectHasFirmwareAuthenticityCheckHardFailed = createMemoizedSelector(
    [selectFirmwareRevisionCheckErrorIfEnabled],
    revisionError => getIsHardRevisionCheckError(revisionError), // FW hash check to be implemented
);

export const selectHasFirmwareAuthenticityCheckHardFailedForSelectedDevice = (
    state: FwAuthenticityCheckState,
) => {
    const device = selectSelectedDevice(state);
    if (!device) return false;

    return selectHasFirmwareAuthenticityCheckHardFailed(state, device);
};

export const selectIsEntropyCheckEnabledAndFailed = createMemoizedSelector(
    [
        (state: FwAuthenticityCheckState) =>
            selectIsFeatureEnabled(state, Feature.entropyCheckMobile, true),
        selectIsEntropyCheckFailed,
    ],
    (isFeatureEnabled, isEntropyCheckFailed) => isFeatureEnabled && isEntropyCheckFailed,
);
export const selectIsEntropyCheckEnabledAndFailedForSelectedDevice = (
    state: FwAuthenticityCheckState,
) => {
    const device = selectSelectedDevice(state);
    if (!device) return false;

    return selectIsEntropyCheckEnabledAndFailed(state, device.id);
};

export const selectIsDeviceIdCheckEnabledAndFailed = createMemoizedSelector(
    [
        selectAreDeviceMetaChecksEnabled,
        (state: FwAuthenticityCheckState) => selectIsFeatureEnabled(state, Feature.idCheck, true),
        (_state: NativeDeviceRootState, device: Device) => device,
    ],
    (areDeviceMetaChecksEnabled, isFeatureEnabled, device) =>
        areDeviceMetaChecksEnabled && isFeatureEnabled && !getIsDeviceIdValid(device),
);

export const selectIsDeviceInvariabilityEnabledAndFailed = createMemoizedSelector(
    [
        selectAreDeviceMetaChecksEnabled,
        (state: FwAuthenticityCheckState) =>
            selectIsFeatureEnabled(state, Feature.invariabilityCheck, true),
        selectIsDeviceInvariabilityCheckSuccess,
    ],
    (areDeviceMetaChecksEnabled, isFeatureEnabled, isDeviceInvariabilityCheckSuccessful) =>
        areDeviceMetaChecksEnabled && isFeatureEnabled && !isDeviceInvariabilityCheckSuccessful,
);

export const selectIsDeviceAuthenticityCheckFailed = createMemoizedSelector(
    [selectDeviceAuthenticityByDeviceId],
    authenticityCheckResult => authenticityCheckResult?.valid === false,
);

export const selectIsDeviceSetupSupported = createMemoizedSelector(
    [selectDeviceModel],
    model => isNotNullOrUndefined(model) && getIsDeviceSetupSupported(model),
);

export const selectShouldFactoryResetBeVisible = createMemoizedSelector(
    [selectIsDeviceInBootloader, selectHasDeviceFirmwareInstalled],
    (isDeviceInBootloader, hasDeviceFirmwareInstalled) =>
        isDeviceInBootloader && hasDeviceFirmwareInstalled,
);

export const selectCompromisedDeviceFailedCheck = (
    state: NativeDeviceRootState,
    device: Device,
) => {
    const deviceId = device?.id;
    const isDeviceAuthenticityCheckEnabled = selectIsDeviceAuthenticityCheckEnabled(state);
    const isDeviceAuthenticityCheckFailed = selectIsDeviceAuthenticityCheckFailed(state, deviceId);
    const isEntropyCheckEnabledAndFailed = selectIsEntropyCheckEnabledAndFailed(state, deviceId);
    const isFirmwareAuthenticityCheckDismissed = selectIsFirmwareAuthenticityCheckDismissed(
        state,
        deviceId,
    );
    const hasFirmwareAuthenticityCheckHardFailed = selectHasFirmwareAuthenticityCheckHardFailed(
        state,
        device,
    );
    const isDeviceIdCheckEnabledAndFailed = selectIsDeviceIdCheckEnabledAndFailed(state, device);
    const isDeviceInvariabilityEnabledAndFailed = selectIsDeviceInvariabilityEnabledAndFailed(
        state,
        device,
    );
    const isDeviceAuthenticityEnabledAndFailed =
        isDeviceAuthenticityCheckEnabled && isDeviceAuthenticityCheckFailed;

    if (isDeviceAuthenticityEnabledAndFailed) return 'device-authenticity';
    if (isEntropyCheckEnabledAndFailed) return 'entropy';

    // All the following checks are dismissable together by a shared mechanism
    if (!isFirmwareAuthenticityCheckDismissed) {
        if (isDeviceIdCheckEnabledAndFailed) return 'device-id';
        if (isDeviceInvariabilityEnabledAndFailed) return 'device-invariability';
        if (hasFirmwareAuthenticityCheckHardFailed) return 'firmware-authenticity';
    }

    return null;
};

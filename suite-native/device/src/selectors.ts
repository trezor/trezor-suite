import { A, pipe } from '@mobily/ts-belt';

import {
    DeviceRootState,
    PORTFOLIO_TRACKER_DEVICE_ID,
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
    MessageSystemRootState,
    selectIsFeatureEnabled,
} from '@suite-common/message-system';
import { createWeakMapSelector, returnStableArrayIfEmpty } from '@suite-common/redux-utils';
import { ThpRootState, selectThpAutoconnectStep } from '@suite-common/thp';
import {
    AccountsRootState,
    DiscoveryRootState,
    FiatRatesRootState,
    WalletSettingsRootState,
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
    Account,
    BaseCurrencyAmount,
    RatesByKey,
    asBaseCurrencyAmount,
} from '@suite-common/wallet-types';
import { getAccountFiatBalance } from '@suite-common/wallet-utils';
import { DeviceOnboardingSliceRootState } from '@suite-native/device-onboarding';
import { FeatureFlagsRootState } from '@suite-native/feature-flags';
import { NativeFirmwareRootState } from '@suite-native/firmware';
import {
    SettingsSliceRootState,
    selectIsDeviceAuthenticityCheckEnabled,
} from '@suite-native/settings';
import { doesCoinSupportStaking } from '@suite-native/staking';
import type { BaseCurrencyCode } from '@trezor/blockchain-link-types';
import { Device } from '@trezor/connect';
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
    const { isFirmwareRevisionCheckEnabled } = state.appSettings;
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

export const selectCompromisedDeviceFailedCheck = createMemoizedSelector(
    [
        selectIsDeviceAuthenticityCheckEnabled,
        (state: NativeDeviceRootState, device: Device) =>
            selectIsDeviceAuthenticityCheckFailed(state, device?.id),
        (state: NativeDeviceRootState, device: Device) =>
            selectIsEntropyCheckEnabledAndFailed(state, device?.id),
        (state: NativeDeviceRootState, device: Device) =>
            selectIsFirmwareAuthenticityCheckDismissed(state, device?.id),
        (state: NativeDeviceRootState, device: Device) =>
            selectHasFirmwareAuthenticityCheckHardFailed(state, device),
    ],
    (
        isDeviceAuthenticityCheckEnabled,
        isDeviceAuthenticityCheckFailed,
        isEntropyCheckEnabledAndFailed,
        isFirmwareAuthenticityCheckDismissed,
        hasFirmwareAuthenticityCheckHardFailed,
    ) => {
        const isDeviceAuthenticityEnabledAndFailed =
            isDeviceAuthenticityCheckEnabled && isDeviceAuthenticityCheckFailed;

        const isFirmwareAuthenticityCheckHardFailedAndNotDismissed =
            hasFirmwareAuthenticityCheckHardFailed && !isFirmwareAuthenticityCheckDismissed;

        if (isDeviceAuthenticityEnabledAndFailed) {
            return 'device-authenticity';
        }
        if (isEntropyCheckEnabledAndFailed) {
            return 'entropy';
        }
        if (isFirmwareAuthenticityCheckHardFailedAndNotDismissed) {
            return 'firmware-authenticity';
        }

        return null;
    },
);

export const selectSelectedDeviceCompromisedDeviceFailedCheck = (state: NativeDeviceRootState) => {
    const device = selectSelectedDevice(state);
    if (!device) return null;

    return selectCompromisedDeviceFailedCheck(state, device);
};

export const selectIsDeviceCompromised = createMemoizedSelector(
    [selectCompromisedDeviceFailedCheck],
    failedCheck => failedCheck !== null,
);

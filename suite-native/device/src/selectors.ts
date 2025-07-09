import { A, G, pipe } from '@mobily/ts-belt';

import {
    Feature,
    MessageSystemRootState,
    selectIsFeatureEnabled,
} from '@suite-common/message-system';
import { createWeakMapSelector, returnStableArrayIfEmpty } from '@suite-common/redux-utils';
import { isDeviceAcquired } from '@suite-common/suite-utils';
import {
    AccountsRootState,
    DeviceRootState,
    DiscoveryRootState,
    FiatRatesRootState,
    PORTFOLIO_TRACKER_DEVICE_ID,
    WalletSettingsRootState,
    getAccountsByDeviceState,
    selectAccounts,
    selectAccountsByDeviceState,
    selectCurrentFiatRates,
    selectDeviceAccounts,
    selectDeviceFirmwareVersionArray,
    selectDeviceInstances,
    selectDeviceModel,
    selectDevices,
    selectHasDeviceFirmwareInstalled,
    selectIsConnectedDeviceUninitialized,
    selectIsDeviceConnectedAndAuthorized,
    selectIsDeviceInBootloader,
    selectIsDiscoveredDeviceAccountless,
    selectIsEntropyCheckFailed,
    selectIsFirmwareAuthenticityCheckDismissed,
    selectIsUnacquiredDevice,
    selectLocalCurrency,
    selectSelectedDevice,
    selectSelectedDeviceAuthenticity,
} from '@suite-common/wallet-core';
import { Account, RatesByKey } from '@suite-common/wallet-types';
import { asBaseCurrencyAmount, getAccountFiatBalance } from '@suite-common/wallet-utils';
import {
    FeatureFlag,
    FeatureFlagsRootState,
    selectIsFeatureFlagEnabled,
} from '@suite-native/feature-flags';
import {
    SettingsSliceRootState,
    selectIsDeviceAuthenticityCheckEnabled,
} from '@suite-native/settings';
import { doesCoinSupportStaking } from '@suite-native/staking';
import type { BaseCurrencyCode } from '@trezor/blockchain-link-types';
import { DeviceModelInternal } from '@trezor/device-utils';
import { BigNumber } from '@trezor/utils';

import { revisionCheckErrorScenarios } from './config/firmware';
import { isDeviceSetupSupported, isFirmwareVersionSupported } from './utils';

type NativeDeviceRootState = DeviceRootState &
    AccountsRootState &
    DiscoveryRootState &
    SettingsSliceRootState &
    WalletSettingsRootState &
    FiatRatesRootState &
    FeatureFlagsRootState &
    MessageSystemRootState;

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

export const selectDeviceError = (
    state: DeviceRootState & AccountsRootState & DiscoveryRootState,
) => {
    const device = selectSelectedDevice(state);

    return device?.error;
};

// FIXME: this function can be removed and substituted with @suite-common/wallet-utils/getTotalFiatBalance when Solana supports staking on mobile.
const getTotalFiatBalanceNative = ({
    deviceAccounts,
    localCurrency,
    rates,
}: {
    deviceAccounts: Account[];
    localCurrency: BaseCurrencyCode;
    rates?: RatesByKey;
}) => {
    let instanceBalance = new BigNumber(0);
    deviceAccounts.forEach(a => {
        const accountFiatBalance =
            getAccountFiatBalance({
                account: a,
                localCurrency,
                rates,
                shouldIncludeStaking: doesCoinSupportStaking(a.symbol),
            }) ?? '0';
        instanceBalance = instanceBalance.plus(accountFiatBalance);
    });

    return asBaseCurrencyAmount(instanceBalance);
};

export const selectSelectedDeviceTotalFiatBalance = createMemoizedSelector(
    [selectDeviceAccounts, selectCurrentFiatRates, selectLocalCurrency],
    (deviceAccounts, rates, localCurrency) =>
        getTotalFiatBalanceNative({ deviceAccounts, localCurrency, rates }),
);

export const selectDeviceTotalFiatBalanceByDeviceState = createMemoizedSelector(
    [selectAccountsByDeviceState, selectCurrentFiatRates, selectLocalCurrency],
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

type FwAuthenticityCheckState = NativeDeviceRootState &
    FeatureFlagsRootState &
    MessageSystemRootState;
/**
 * Get firmware revision check error, or null if check was successful / skipped, if the check is enabled in settings and through message system.
 */
export const selectFirmwareRevisionCheckErrorIfEnabled = (state: FwAuthenticityCheckState) => {
    const revisionCheckError = selectFirmwareRevisionCheckError(state);
    const { isFirmwareRevisionCheckEnabled } = state.appSettings;
    const isDeviceConnectEnabled = selectIsFeatureFlagEnabled(
        state,
        FeatureFlag.IsDeviceConnectEnabled,
    );
    const isMessageSystemFeatureEnabled = selectIsFeatureEnabled(
        state,
        Feature.firmwareRevisionCheckMobile,
        true,
    );
    const isCheckEnabled =
        isFirmwareRevisionCheckEnabled && isDeviceConnectEnabled && isMessageSystemFeatureEnabled;

    return isCheckEnabled ? revisionCheckError : null;
};

/**
 * Determine if either of firmware authenticity checks is considered as hard failure (in order to restrict interaction with device).
 */
export const selectHasFirmwareAuthenticityCheckHardFailed = createMemoizedSelector(
    [selectFirmwareRevisionCheckErrorIfEnabled],
    revisionError => {
        const isRevisionHardError =
            revisionError !== null &&
            revisionCheckErrorScenarios[revisionError].type === 'hardModal';

        // FW hash check to be implemented

        return isRevisionHardError;
    },
);

export const selectIsEntropyCheckEnabledAndFailed = createMemoizedSelector(
    [
        (state: FwAuthenticityCheckState) =>
            selectIsFeatureEnabled(state, Feature.firmwareRevisionCheckMobile, true),
        selectIsEntropyCheckFailed,
    ],
    (isFeatureEnabled, isEntropyCheckFailed) => isFeatureEnabled && isEntropyCheckFailed,
);

export const selectIsDeviceAuthenticityCheckFailed = createMemoizedSelector(
    [selectSelectedDeviceAuthenticity],
    selectedDeviceAuthenticity => selectedDeviceAuthenticity?.valid === false,
);

export const selectIsDeviceSetupSupported = createMemoizedSelector(
    [
        selectDeviceModel,
        (state: MessageSystemRootState) =>
            selectIsFeatureEnabled(state, Feature.deviceOnboardingMobile, true),
        (state: NativeDeviceRootState) =>
            selectIsFeatureEnabled(state, Feature.deviceOnboardingMobileT2T1, true),
    ],
    (model, isDeviceOnboardingFeatureFlagEnabled, isModelTDeviceOnboardingFeatureFlagEnabled) =>
        isDeviceOnboardingFeatureFlagEnabled &&
        G.isNotNullable(model) &&
        (isDeviceSetupSupported(model) ||
            (isModelTDeviceOnboardingFeatureFlagEnabled && model === DeviceModelInternal.T2T1)),
);

export const selectShouldFactoryResetBeVisible = createMemoizedSelector(
    [selectIsDeviceInBootloader, selectHasDeviceFirmwareInstalled],
    (isDeviceInBootloader, hasDeviceFirmwareInstalled) =>
        isDeviceInBootloader && hasDeviceFirmwareInstalled,
);

export const selectIsDeviceCompromised = createMemoizedSelector(
    [
        selectIsDeviceAuthenticityCheckEnabled,
        selectIsDeviceAuthenticityCheckFailed,
        selectIsEntropyCheckEnabledAndFailed,
        selectIsFirmwareAuthenticityCheckDismissed,
        selectHasFirmwareAuthenticityCheckHardFailed,
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

        return (
            isDeviceAuthenticityEnabledAndFailed ||
            isEntropyCheckEnabledAndFailed ||
            isFirmwareAuthenticityCheckHardFailedAndNotDismissed
        );
    },
);

export const selectCompromisedDeviceFailedCheck = createMemoizedSelector(
    [
        selectIsDeviceAuthenticityCheckEnabled,
        selectIsDeviceAuthenticityCheckFailed,
        selectIsEntropyCheckEnabledAndFailed,
    ],
    (
        isDeviceAuthenticityCheckEnabled,
        isDeviceAuthenticityCheckFailed,
        isEntropyCheckEnabledAndFailed,
    ) => {
        const isDeviceAuthenticityEnabledAndFailed =
            isDeviceAuthenticityCheckEnabled && isDeviceAuthenticityCheckFailed;

        if (isDeviceAuthenticityEnabledAndFailed) {
            return 'device-authenticity';
        }
        if (isEntropyCheckEnabledAndFailed) {
            return 'entropy';
        }

        return 'firmware-authenticity';
    },
);

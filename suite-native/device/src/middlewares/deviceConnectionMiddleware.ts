import { createListenerMiddleware, current } from '@reduxjs/toolkit';

import { MessageSystemRootState } from '@suite-common/message-system';
import {
    AccountsRootState,
    DeviceRootState,
    DiscoveryRootState,
    FiatRatesRootState,
    WalletSettingsRootState,
    deviceConnectThunks,
    selectIsDeviceConnectedAndAuthorized,
    selectIsDeviceInitialized,
    selectIsDeviceUsingPassphrase,
    selectIsPortfolioTrackerDevice,
} from '@suite-common/wallet-core';
import { DeviceAuthorizationRootState } from '@suite-native/device-authorization';
import { FeatureFlagsRootState } from '@suite-native/feature-flags';
import {
    NativeFirmwareRootState,
    selectIsFirmwareInstallationRunning,
} from '@suite-native/firmware';
import {
    AuthorizeDeviceStackRoutes,
    RootStackRoutes,
    navigationContainerRef,
} from '@suite-native/navigation';
import {
    SettingsSliceRootState,
    selectIsCoinEnablingInitFinished,
    selectIsOnboardingFinished,
} from '@suite-native/settings';

export const deviceConnectionMiddleware = createListenerMiddleware<
    DeviceRootState &
        MessageSystemRootState &
        AccountsRootState &
        DiscoveryRootState &
        SettingsSliceRootState &
        WalletSettingsRootState &
        FiatRatesRootState &
        FeatureFlagsRootState &
        DeviceAuthorizationRootState &
        NativeFirmwareRootState
>();

deviceConnectionMiddleware.startListening({
    predicate: (action, currentState) =>
        deviceConnectThunks.fulfilled.match(action) &&
        selectIsOnboardingFinished(currentState) &&
        selectIsDeviceInitialized(currentState),
    effect: (_, { getState }) => {
        const isPortfolioTrackerDevice = selectIsPortfolioTrackerDevice(getState());

        // We don't display connecting screen for portfolio tracker
        if (isPortfolioTrackerDevice) return;

        const isDeviceUsingPassphrase = selectIsDeviceUsingPassphrase(getState());
        // Passphrase protected devices are only connected through passphrase form (in app / in device)
        // The passphrase flow handles connection differently and redirect to connecting screen is not wanted.
        if (isDeviceUsingPassphrase) return;

        const isFirmwareInstallationRunning = selectIsFirmwareInstallationRunning(getState());

        // TODO check for suspicious screen should also be here
        if (isFirmwareInstallationRunning) return;

        const isDeviceConnectedAndAuthorized = selectIsDeviceConnectedAndAuthorized(getState());
        // Only display connecting screen for unauthorized devices
        // TODO this seems smelly - why would newly connected device be authorized?
        if (isDeviceConnectedAndAuthorized) return;

        const isCoinEnablingInitFinished = selectIsCoinEnablingInitFinished(getState());

        if (isCoinEnablingInitFinished) {
            navigationContainerRef.navigate(RootStackRoutes.AuthorizeDeviceStack, {
                screen: AuthorizeDeviceStackRoutes.ConnectingDevice,
            });
        } else {
            navigationContainerRef.navigate(RootStackRoutes.CoinEnablingInit);
        }
    },
});

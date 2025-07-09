import {
    Dispatch,
    ListenerEffectAPI,
    UnknownAction,
    createListenerMiddleware,
} from '@reduxjs/toolkit';

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

import { selectCompromisedDeviceFailedCheck, selectIsDeviceCompromised } from '../selectors';

export type DeviceConnectionState = DeviceRootState &
    MessageSystemRootState &
    AccountsRootState &
    DiscoveryRootState &
    SettingsSliceRootState &
    WalletSettingsRootState &
    FiatRatesRootState &
    FeatureFlagsRootState &
    DeviceAuthorizationRootState &
    NativeFirmwareRootState;

export const deviceConnectionMiddleware = createListenerMiddleware<DeviceConnectionState>();

// At the moment when unauthorized physical device is selected,
// redirect to the Connecting screen where is handled the connection logic.
export const deviceConnectionPredicate = (
    action: UnknownAction,
    currentState: DeviceConnectionState,
) =>
    deviceConnectThunks.fulfilled.match(action) &&
    selectIsOnboardingFinished(currentState) &&
    selectIsDeviceInitialized(currentState);

export const deviceConnectionEffect = (
    _: UnknownAction,
    { getState }: ListenerEffectAPI<DeviceConnectionState, Dispatch<UnknownAction>>,
) => {
    const isPortfolioTrackerDevice = selectIsPortfolioTrackerDevice(getState());

    // We don't display connecting screen for portfolio tracker
    if (isPortfolioTrackerDevice) return;

    const isDeviceUsingPassphrase = selectIsDeviceUsingPassphrase(getState());
    // Passphrase protected devices are only connected through passphrase form (in app / in device)
    // The passphrase flow handles connection differently and redirect to connecting screen is not wanted.
    // TODO we could just check this from the action maybe?
    if (isDeviceUsingPassphrase) return;

    const isFirmwareInstallationRunning = selectIsFirmwareInstallationRunning(getState());

    // TODO can we just stop the listener when firmware installation is running?
    if (isFirmwareInstallationRunning) return;

    const isDeviceConnectedAndAuthorized = selectIsDeviceConnectedAndAuthorized(getState());

    // Probably doesn't need to be here. It was added when authorizeDeviceThunk was called from useEffect
    // inside useHandleDeviceConnection. Now the device is authorized regardless and I think we can navigate
    // since it was because of biometrics and those are handled separately.
    // Reference https://github.com/trezor/trezor-suite/pull/11319/commits/a9152279fe6d70c57fa16ee0bf75dc9fd52bb930
    if (isDeviceConnectedAndAuthorized) return;

    const shouldNavigateToDeviceCompromisedModal = selectIsDeviceCompromised(getState());
    if (shouldNavigateToDeviceCompromisedModal) {
        const compromisedDeviceFailedCheck = selectCompromisedDeviceFailedCheck(getState());
        navigationContainerRef.navigate(RootStackRoutes.DeviceCompromisedModal, {
            failedCheck: compromisedDeviceFailedCheck,
        });

        return;
    }

    const isCoinEnablingInitFinished = selectIsCoinEnablingInitFinished(getState());
    if (isCoinEnablingInitFinished) {
        navigationContainerRef.navigate(RootStackRoutes.AuthorizeDeviceStack, {
            screen: AuthorizeDeviceStackRoutes.ConnectingDevice,
        });
    } else {
        navigationContainerRef.navigate(RootStackRoutes.CoinEnablingInit);
    }
};

export const stopDeviceConnectionListening = () => {
    deviceConnectionMiddleware.stopListening({
        predicate: deviceConnectionPredicate,
        effect: deviceConnectionEffect,
        cancelActive: true,
    });
};

export const restartDeviceConnectionListening = () => {
    deviceConnectionMiddleware.startListening({
        predicate: deviceConnectionPredicate,
        effect: deviceConnectionEffect,
    });
};

deviceConnectionMiddleware.startListening({
    predicate: deviceConnectionPredicate,
    effect: deviceConnectionEffect,
});

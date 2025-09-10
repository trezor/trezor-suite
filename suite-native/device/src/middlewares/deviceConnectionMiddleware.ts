import {
    Dispatch,
    ListenerEffectAPI,
    UnknownAction,
    createListenerMiddleware,
} from '@reduxjs/toolkit';

import { isThpDevice } from '@suite-common/suite-utils';
import { isThpPairingUIRequestButtonAction } from '@suite-common/thp';
import {
    deviceActions,
    deviceConnectThunks,
    selectIsDeviceConnectedAndAuthorized,
    selectIsDeviceInitialized,
    selectIsDeviceRemembered,
    selectIsDeviceUsingPassphrase,
} from '@suite-common/wallet-core';
import {
    selectIsOnboardingDeviceDisconnectedAlertDisplayed,
    selectWasDeviceOnboardingCancelled,
} from '@suite-native/device-onboarding';
import { selectIsFirmwareInstallationRunning } from '@suite-native/firmware';
import {
    AuthorizeDeviceStackRoutes,
    DeviceOnboardingStackRoutes,
    HomeStackRoutes,
    RootStackRoutes,
    checkIsActiveRouteAnyOf,
    checkIsActiveRouteAnyOfBlacklisted,
    navigationContainerRef,
} from '@suite-native/navigation';
import { selectIsCoinEnablingInitFinished } from '@suite-native/settings';

import {
    DEVICE_CONNECTION_BLACKLISTED_ROUTES,
    buildDisconnectionBlacklist,
} from '../deviceNavigationConfig';
import {
    NativeDeviceRootState,
    selectIsDeviceCompromised,
    selectIsDeviceSetupSupported,
    selectIsEntropyCheckEnabledAndFailed,
} from '../selectors';
import { isDeviceConnectAction } from '../utils';

export const deviceConnectionMiddleware = createListenerMiddleware<NativeDeviceRootState>();

const handleDeviceConnectNavigation = ({
    isCoinEnablingInitFinished,
    isDeviceInitialized,
    isDeviceSetupSupported,
    wasDeviceOnboardingCancelled,
    isOnboardingDeviceDisconnectedAlertDisplayed,
    isReconnectingDeviceOnDeviceOnboarding,
}: {
    isCoinEnablingInitFinished: boolean;
    isDeviceInitialized: boolean;
    isDeviceSetupSupported: boolean;
    wasDeviceOnboardingCancelled: boolean;
    isOnboardingDeviceDisconnectedAlertDisplayed: boolean;
    isReconnectingDeviceOnDeviceOnboarding: boolean;
}) => {
    // If device setup is not supported, we don't want to navigate anywhere
    // We handle it separately in `useDetectDeviceError` hook
    if (!isDeviceSetupSupported) return;

    if (isCoinEnablingInitFinished) {
        navigationContainerRef.navigate(RootStackRoutes.AuthorizeDeviceStack, {
            screen: AuthorizeDeviceStackRoutes.ConnectingDevice,
        });
    } else if (!isDeviceInitialized) {
        if (
            isOnboardingDeviceDisconnectedAlertDisplayed ||
            isReconnectingDeviceOnDeviceOnboarding
        ) {
            return;
        }

        if (wasDeviceOnboardingCancelled) {
            console.warn('navigate home');
        } else {
            // If THP confirmation screen was shown, we want to prevent swiping/navigating back to
            // that THP confirmation screen. Swiping/navigating back shall lead to the Home screen.
            navigationContainerRef.reset({
                index: 1,
                routes: [
                    {
                        name: RootStackRoutes.AppTabs,
                        params: {
                            screen: HomeStackRoutes.Home,
                        },
                    },
                    {
                        name: RootStackRoutes.DeviceOnboardingStack,
                        params: {
                            screen: DeviceOnboardingStackRoutes.UninitializedDeviceLanding,
                        },
                    },
                ],
            });
        }
    } else {
        navigationContainerRef.navigate(RootStackRoutes.CoinEnablingInit);
    }
};

deviceConnectionMiddleware.startListening({
    predicate: action => isDeviceConnectAction(action),
    effect: (
        action: UnknownAction,
        { getState }: ListenerEffectAPI<NativeDeviceRootState, Dispatch<UnknownAction>>,
    ) => {
        const shouldNavigateToDeviceCompromisedModal = selectIsDeviceCompromised(getState());

        if (!checkIsActiveRouteAnyOfBlacklisted(DEVICE_CONNECTION_BLACKLISTED_ROUTES)) return;

        // During firmware installation, device restarts (disconnect + connect) and we want to ignore it.
        if (selectIsFirmwareInstallationRunning(getState())) return;

        if (shouldNavigateToDeviceCompromisedModal) {
            // When the compromised modal is closed on first connection and no coins would be selected, we will need to redirect user
            // to coin enabling so he can continue to the app with running discovery.
            navigationContainerRef.navigate(RootStackRoutes.DeviceCompromisedModal);

            return;
        }

        // If device is authorized already (usually in case of remembered device which has already been authorized)
        const isDeviceConnectedAndAuthorized = selectIsDeviceConnectedAndAuthorized(getState());
        // Passphrase protected devices are only connected through passphrase form
        // The passphrase flow handles connection differently and redirect to connecting screen is not wanted.
        const isDeviceUsingPassphrase = selectIsDeviceUsingPassphrase(getState());

        if (isDeviceUsingPassphrase) return;

        const isNonThpRememberedDeviceConnectAction =
            isDeviceConnectedAndAuthorized &&
            deviceConnectThunks.fulfilled.match(action) &&
            !isThpDevice(action.meta.arg.device);

        if (isNonThpRememberedDeviceConnectAction) return;

        handleDeviceConnectNavigation({
            isCoinEnablingInitFinished: selectIsCoinEnablingInitFinished(getState()),
            isDeviceInitialized: selectIsDeviceInitialized(getState()),
            isDeviceSetupSupported: selectIsDeviceSetupSupported(getState()),
            wasDeviceOnboardingCancelled: selectWasDeviceOnboardingCancelled(getState()),
            isOnboardingDeviceDisconnectedAlertDisplayed:
                selectIsOnboardingDeviceDisconnectedAlertDisplayed(getState()),
            isReconnectingDeviceOnDeviceOnboarding:
                checkIsActiveRouteAnyOf([RootStackRoutes.DeviceOnboardingStack]) &&
                checkIsActiveRouteAnyOfBlacklisted([
                    DeviceOnboardingStackRoutes.ConnectAndUnlockDevice,
                ]),
        });
    },
});

deviceConnectionMiddleware.startListening({
    predicate: action => deviceActions.deviceDisconnect.match(action),
    effect: (_action: UnknownAction, { getState }) => {
        const isDeviceRemembered = selectIsDeviceRemembered(getState());
        const isEntropyCheckEnabledAndFailed = selectIsEntropyCheckEnabledAndFailed(getState());
        const isFirmwareInstallationRunning = selectIsFirmwareInstallationRunning(getState());

        const isDeviceDisconnectionNavigationAllowed = checkIsActiveRouteAnyOfBlacklisted(
            buildDisconnectionBlacklist(isEntropyCheckEnabledAndFailed, isDeviceRemembered),
        );

        if (!isDeviceDisconnectionNavigationAllowed || isFirmwareInstallationRunning) return;

        if (checkIsActiveRouteAnyOf([RootStackRoutes.DeviceOnboardingStack])) {
            navigationContainerRef.navigate(RootStackRoutes.DeviceOnboardingStack, {
                screen: DeviceOnboardingStackRoutes.ConnectAndUnlockDevice,
            });
        } else {
            navigationContainerRef.reset({
                index: 0,
                routes: [
                    {
                        name: RootStackRoutes.AppTabs,
                        params: {
                            screen: HomeStackRoutes.Home,
                        },
                    },
                ],
            });
        }
    },
});

deviceConnectionMiddleware.startListening({
    predicate: (action: UnknownAction) => isThpPairingUIRequestButtonAction(action),
    effect: (_action: UnknownAction, { getState }) => {
        if (selectIsFirmwareInstallationRunning(getState())) return;

        // Nothing can be accomplished before a THP connection is established.
        navigationContainerRef.navigate(RootStackRoutes.AuthorizeDeviceStack, {
            screen: AuthorizeDeviceStackRoutes.ThpConfirmation,
        });
    },
});

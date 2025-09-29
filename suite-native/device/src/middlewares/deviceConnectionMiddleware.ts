import {
    Dispatch,
    ListenerEffectAPI,
    UnknownAction,
    createListenerMiddleware,
} from '@reduxjs/toolkit';

import {
    getDeviceInternalModel,
    getIsDeviceInitialized,
    isDeviceConnectedViaBluetooth,
} from '@suite-common/suite-utils';
import { isThpPairingUIRequestButtonAction } from '@suite-common/thp';
import {
    deviceActions,
    selectDevices,
    selectIsDeviceRemembered,
    selectIsDeviceUsingPassphrase,
} from '@suite-common/wallet-core';
import { selectWasDeviceOnboardingCancelled } from '@suite-native/device-onboarding';
import { selectIsFirmwareInstallationRunning } from '@suite-native/firmware';
import {
    AuthorizeDeviceStackRoutes,
    DeviceOnboardingStackRoutes,
    HomeStackRoutes,
    RootStackRoutes,
    checkIsActiveRouteAnyOf,
    checkIsDeviceOnboardingFocused,
    checkIsHomeStackFocused,
    navigationContainerRef,
} from '@suite-native/navigation';
import { selectIsCoinEnablingInitFinished } from '@suite-native/settings';
import { hasBitcoinOnlyFirmware } from '@trezor/device-utils';

import {
    DEVICE_CONNECTION_BLACKLISTED_ROUTES,
    buildDisconnectionBlacklist,
} from '../deviceNavigationConfig';
import {
    NativeDeviceRootState,
    selectIsDeviceCompromised,
    selectIsEntropyCheckEnabledAndFailed,
} from '../selectors';
import { getIsDeviceSetupSupported } from '../utils';

export const deviceConnectionMiddleware = createListenerMiddleware<NativeDeviceRootState>();

const handleDeviceConnectNavigation = ({
    hasDeviceBitcoinOnlyFirmware,
    isCoinEnablingInitFinished,
    isDeviceInitialized,
    isDeviceSetupSupported,
    wasDeviceOnboardingCancelled,
}: {
    hasDeviceBitcoinOnlyFirmware: boolean;
    isCoinEnablingInitFinished: boolean;
    isDeviceInitialized: boolean;
    isDeviceSetupSupported: boolean;
    wasDeviceOnboardingCancelled: boolean;
}) => {
    if (!isDeviceInitialized) {
        // If device setup is not supported, we don't want to navigate anywhere
        // We handle it separately in `useDetectDeviceError` hook. Ideally, the alert would be triggered here (it would need to be in redux though).
        if (!isDeviceSetupSupported) return;

        // If user previously cancelled the onboarding, they should remaing on homescreen
        if (wasDeviceOnboardingCancelled) {
            // No need to navigate if we are already on home screen (preventing sliding to new screen)
            if (checkIsHomeStackFocused()) return;

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

            return;
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

            return;
        }
    }

    if (isCoinEnablingInitFinished || hasDeviceBitcoinOnlyFirmware) {
        // Bitcoin is enabled and coin enabling finished with btc-only FW in discoverMiddleware.
        navigationContainerRef.navigate(RootStackRoutes.AuthorizeDeviceStack, {
            screen: AuthorizeDeviceStackRoutes.ConnectingDevice,
        });
    } else {
        navigationContainerRef.navigate(RootStackRoutes.AuthorizeDeviceStack, {
            screen: AuthorizeDeviceStackRoutes.CoinEnablingInit,
        });
    }
};

deviceConnectionMiddleware.startListening({
    predicate: action => deviceActions.connectDevice.match(action),
    effect: (
        action: UnknownAction,
        {
            getState,
            getOriginalState,
        }: ListenerEffectAPI<NativeDeviceRootState, Dispatch<UnknownAction>>,
    ) => {
        if (!deviceActions.connectDevice.match(action)) {
            throw new Error('This listener only handles connectDevice action');
        }

        // FYI: This is the only device you should access from this middleware. At this point, selectedDevice is previously connected device.
        // Your decision logic should be derived from device passed from TrezorConnect in the action payload (not selectedDevice from the state).
        const { device } = action.payload;

        const shouldNavigateToDeviceCompromisedModal = selectIsDeviceCompromised(getState());

        if (checkIsActiveRouteAnyOf(DEVICE_CONNECTION_BLACKLISTED_ROUTES)) return;

        // During firmware installation, device restarts (disconnect + connect) and we want to ignore it.
        if (selectIsFirmwareInstallationRunning(getState())) return;

        if (shouldNavigateToDeviceCompromisedModal) {
            // When the compromised modal is closed on first connection and no coins would be selected, we will need to redirect user
            // to coin enabling so he can continue to the app with running discovery.
            navigationContainerRef.navigate(RootStackRoutes.DeviceCompromisedModal);

            return;
        }

        // Passphrase protected devices are only connected through passphrase form
        // The passphrase flow handles connection differently and redirect to connecting screen is not wanted.
        const isDeviceUsingPassphrase = selectIsDeviceUsingPassphrase(getState());

        if (isDeviceUsingPassphrase) return;

        // If device is authorized already (usually in case of remembered device which has already been authorized)
        // We need to use the state before we add connected device to the array so we find out whether it was previously remembered
        const isDeviceRemembered =
            !!device.features && selectDevices(getOriginalState()).some(d => d.id === device.id);

        if (isDeviceRemembered) return;

        handleDeviceConnectNavigation({
            hasDeviceBitcoinOnlyFirmware: hasBitcoinOnlyFirmware(device),
            isCoinEnablingInitFinished: selectIsCoinEnablingInitFinished(getState()),
            isDeviceInitialized: getIsDeviceInitialized({
                deviceMode: device.mode,
                deviceFeatures: device.features,
            }),
            isDeviceSetupSupported: getIsDeviceSetupSupported(getDeviceInternalModel(device)),
            wasDeviceOnboardingCancelled: selectWasDeviceOnboardingCancelled(getState()),
        });
    },
});

deviceConnectionMiddleware.startListening({
    predicate: action => deviceActions.deviceDisconnect.match(action),
    effect: (action: UnknownAction, { getState }) => {
        if (!deviceActions.deviceDisconnect.match(action)) {
            throw new Error('This listener only handles deviceDisconnect action');
        }

        const isDeviceRemembered = selectIsDeviceRemembered(getState());
        const isEntropyCheckEnabledAndFailed = selectIsEntropyCheckEnabledAndFailed(getState());
        const isFirmwareInstallationRunning = selectIsFirmwareInstallationRunning(getState());
        const wasDeviceConnectedViaBluetooth = isDeviceConnectedViaBluetooth(action.payload);

        if (
            checkIsActiveRouteAnyOf(
                buildDisconnectionBlacklist(isEntropyCheckEnabledAndFailed, isDeviceRemembered),
            ) ||
            isFirmwareInstallationRunning
        )
            return;

        if (checkIsDeviceOnboardingFocused()) {
            navigationContainerRef.navigate(RootStackRoutes.DeviceOnboardingStack, {
                screen: DeviceOnboardingStackRoutes.DeviceDisconnected,
                params: { wasDeviceConnectedViaBluetooth },
            });
        } else {
            if (!checkIsHomeStackFocused()) {
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

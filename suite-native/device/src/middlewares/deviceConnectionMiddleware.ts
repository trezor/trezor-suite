import {
    Dispatch,
    ListenerEffectAPI,
    UnknownAction,
    createListenerMiddleware,
} from '@reduxjs/toolkit';

import { deviceActions, selectDevices, selectIsDeviceRemembered } from '@suite-common/device';
import {
    getDeviceInternalModel,
    getIsDeviceDescriptorApiTypeBluetooth,
    getIsDeviceInitialized,
} from '@suite-common/suite-utils';
import { isThpPairingUIRequestButtonAction, selectThpAutoconnectStep } from '@suite-common/thp';
import { selectIsAnyNetworkEnabled } from '@suite-common/wallet-core';
import { selectWasDeviceOnboardingCancelled } from '@suite-native/device-onboarding';
import { selectIsFirmwareInstallationRunning } from '@suite-native/firmware';
import {
    AuthorizeDeviceStackRoutes,
    DeviceOnboardingStackRoutes,
    DeviceSettingsStackRoutes,
    HomeStackRoutes,
    RootStackRoutes,
    checkIsActiveRouteAnyOf,
    checkIsDeviceOnboardingFocused,
    checkIsHomeStackFocused,
    navigationContainerRef,
} from '@suite-native/navigation';
import { DeviceModelInternal, hasBitcoinOnlyFirmware } from '@trezor/device-utils';

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
    deviceModel,
    isAnyNetworkEnabled,
    hasDeviceBitcoinOnlyFirmware,
    isDeviceInitialized,
    isDeviceSetupSupported,
    wasDeviceOnboardingCancelled,
}: {
    deviceModel: DeviceModelInternal;
    isAnyNetworkEnabled: boolean;
    hasDeviceBitcoinOnlyFirmware: boolean;
    isDeviceInitialized: boolean;
    isDeviceSetupSupported: boolean;
    wasDeviceOnboardingCancelled: boolean;
}) => {
    if (!navigationContainerRef.isReady()) return;
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
                            params: {
                                deviceModel,
                            },
                        },
                    },
                ],
            });

            return;
        }
    }

    if (isAnyNetworkEnabled || hasDeviceBitcoinOnlyFirmware) {
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
        if (!navigationContainerRef.isReady()) return;

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

        // In case auto-connect is offered, we don't want to interfere with the flow.
        if (selectThpAutoconnectStep(getState()) === 'AutoconnectInfo') return;

        // If device is authorized already (usually in case of remembered device which has already been authorized)
        // We need to use the state before we add connected device to the array so we find out whether it was previously remembered
        const isDeviceRemembered =
            !!device.features && selectDevices(getOriginalState()).some(d => d.id === device.id);

        const isAnyNetworkEnabled = selectIsAnyNetworkEnabled(getState());

        if (isDeviceRemembered && isAnyNetworkEnabled) return;

        handleDeviceConnectNavigation({
            deviceModel: getDeviceInternalModel(device),
            hasDeviceBitcoinOnlyFirmware: hasBitcoinOnlyFirmware(device),
            isDeviceInitialized: getIsDeviceInitialized({
                deviceMode: device.mode,
                deviceFeatures: device.features,
            }),
            isDeviceSetupSupported: getIsDeviceSetupSupported(getDeviceInternalModel(device)),
            wasDeviceOnboardingCancelled: selectWasDeviceOnboardingCancelled(getState()),
            isAnyNetworkEnabled,
        });
    },
});

deviceConnectionMiddleware.startListening({
    predicate: action => deviceActions.deviceDisconnect.match(action),
    effect: (action: UnknownAction, { getState }) => {
        if (!navigationContainerRef.isReady()) return;

        if (!deviceActions.deviceDisconnect.match(action)) {
            throw new Error('This listener only handles deviceDisconnect action');
        }

        const isDeviceRemembered = selectIsDeviceRemembered(getState());
        const isEntropyCheckEnabledAndFailed = selectIsEntropyCheckEnabledAndFailed(getState());
        const isFirmwareInstallationRunning = selectIsFirmwareInstallationRunning(getState());
        const wasDeviceConnectedViaBluetooth = getIsDeviceDescriptorApiTypeBluetooth(
            action.payload,
        );

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
    predicate: isThpPairingUIRequestButtonAction,
    effect: (_, { getState }) => {
        if (!navigationContainerRef.isReady()) return;

        if (
            selectIsFirmwareInstallationRunning(getState()) ||
            checkIsActiveRouteAnyOf([
                DeviceSettingsStackRoutes.DeviceNameStack,
                DeviceSettingsStackRoutes.FirmwareUpdateStack,
                DeviceSettingsStackRoutes.FirmwareLanguageStack,
                DeviceSettingsStackRoutes.DevicePinProtectionStack,
                DeviceSettingsStackRoutes.DeviceCheckBackupStack,
                DeviceSettingsStackRoutes.DevicePassphraseStack,
                DeviceSettingsStackRoutes.DeviceAuthenticityStack,
                DeviceSettingsStackRoutes.WipeDeviceStack,
            ])
        ) {
            return;
        }

        // Nothing can be accomplished before a THP connection is established.
        navigationContainerRef.navigate(RootStackRoutes.AuthorizeDeviceStack, {
            screen: AuthorizeDeviceStackRoutes.ThpConfirmation,
        });
    },
});

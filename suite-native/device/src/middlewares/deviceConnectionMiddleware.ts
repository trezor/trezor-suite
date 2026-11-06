import {
    type Dispatch,
    type ListenerEffectAPI,
    type UnknownAction,
    createListenerMiddleware,
} from '@reduxjs/toolkit';

import { deviceActions, selectDevices, selectSelectedDevice } from '@suite-common/device';
import { selectIsAnyDeviceCheckRequired } from '@suite-common/device-authenticity';
import { persistentDeviceDataActions } from '@suite-common/persistent-device-data';
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
import { selectDeviceAuthenticityCheckSettings } from '@suite-native/settings';
import { type DeviceModelInternal, hasBitcoinOnlyFirmware } from '@trezor/device-utils';

import {
    DEVICE_CONNECTION_BLACKLISTED_ROUTES,
    DEVICE_DISCONNECTION_BLACKLISTED_ROUTES,
} from '../deviceNavigationConfig';
import { type NativeDeviceRootState, selectCompromisedDeviceFailedCheck } from '../selectors';
import { getIsDeviceSetupSupported } from '../utils';

export const deviceConnectionMiddleware = createListenerMiddleware<NativeDeviceRootState>();

type NavigateToDeviceOnboardingParams = {
    deviceModel: DeviceModelInternal;
    wasDeviceOnboardingCancelled: boolean;
};

const navigateToDeviceOnboarding = ({
    deviceModel,
    wasDeviceOnboardingCancelled,
}: NavigateToDeviceOnboardingParams) => {
    // If user previously cancelled the onboarding, they should remain on homescreen, where they can re-enter it.
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
    }

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
                    screen: DeviceOnboardingStackRoutes.DeviceVisualCheck,
                    params: {
                        deviceModel,
                    },
                },
            },
        ],
    });
};

type HandleDeviceConnectNavigationParams = {
    deviceModel: DeviceModelInternal;
    isAnyNetworkEnabled: boolean;
    hasDeviceBitcoinOnlyFirmware: boolean;
    isDeviceInitialized: boolean;
    isDeviceSetupSupported: boolean;
    wasDeviceOnboardingCancelled: boolean;
};

const handleDeviceConnectNavigation = ({
    deviceModel,
    isAnyNetworkEnabled,
    hasDeviceBitcoinOnlyFirmware,
    isDeviceInitialized,
    isDeviceSetupSupported,
    wasDeviceOnboardingCancelled,
}: HandleDeviceConnectNavigationParams) => {
    if (!navigationContainerRef.isReady()) return;
    if (!isDeviceInitialized) {
        // If device setup is not supported, we don't want to navigate anywhere
        // We handle it separately in `useDetectDeviceError` hook. Ideally, the alert would be triggered here (it would need to be in redux though).
        if (!isDeviceSetupSupported) return;

        navigateToDeviceOnboarding({ deviceModel, wasDeviceOnboardingCancelled });

        return;
    }

    if (isAnyNetworkEnabled || hasDeviceBitcoinOnlyFirmware) {
        // Bitcoin is enabled and coin enabling finished with btc-only FW in discoverMiddleware.
        navigationContainerRef.navigate(RootStackRoutes.AuthorizeDeviceStack, {
            screen: AuthorizeDeviceStackRoutes.ConnectingDevice,
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

        const failedCheck = selectCompromisedDeviceFailedCheck(getState(), device);

        if (checkIsActiveRouteAnyOf(DEVICE_CONNECTION_BLACKLISTED_ROUTES)) return;

        // During firmware installation, device restarts (disconnect + connect) and we want to ignore it.
        if (selectIsFirmwareInstallationRunning(getState())) return;

        if (failedCheck) {
            // When the compromised modal is closed on first connection and no coins would be selected, we will need to redirect user
            // to coin enabling so he can continue to the app with running discovery.
            navigationContainerRef.navigate(RootStackRoutes.DeviceCompromisedModal, {
                failedCheck,
            });

            return;
        }

        // In case auto-connect is offered, we don't want to interfere with the flow.
        if (selectThpAutoconnectStep(getState()) === 'AutoconnectInfo') return;

        const deviceModel = getDeviceInternalModel(device);
        const isDeviceInitialized = getIsDeviceInitialized({
            deviceMode: device.mode,
            deviceFeatures: device.features,
        });
        const wasDeviceOnboardingCancelled = selectWasDeviceOnboardingCancelled(getState());

        // Initialized devices skip the onboarding, but they still need to pass the interactive device checks
        // (Device Visual Check, Device Authenticity Check), which are a part of the onboarding flow.
        // The payload device lacks the `connected` flag, so the device processed by the reducer is used instead.
        const connectedDevice = selectDevices(getState()).find(
            d => d.connected && d.path === device.path,
        );
        const isAnyDeviceCheckRequired = selectIsAnyDeviceCheckRequired(
            getState(),
            connectedDevice,
            selectDeviceAuthenticityCheckSettings(getState()),
        );
        if (isDeviceInitialized && isAnyDeviceCheckRequired) {
            navigateToDeviceOnboarding({ deviceModel, wasDeviceOnboardingCancelled });

            return;
        }

        // If device is authorized already (usually in case of remembered device which has already been authorized)
        // We need to use the state before we add connected device to the array so we find out whether it was previously remembered
        const isDeviceRemembered =
            !!device.features && selectDevices(getOriginalState()).some(d => d.id === device.id);

        const isAnyNetworkEnabled = selectIsAnyNetworkEnabled(getState());

        if (isDeviceRemembered && isAnyNetworkEnabled) return;

        handleDeviceConnectNavigation({
            deviceModel,
            hasDeviceBitcoinOnlyFirmware: hasBitcoinOnlyFirmware(device),
            isDeviceInitialized,
            isDeviceSetupSupported: getIsDeviceSetupSupported(deviceModel),
            wasDeviceOnboardingCancelled,
            isAnyNetworkEnabled,
        });
    },
});

// Discovery entropy check fails during discovery, not on connect, so the modal is displayed as soon as it fails.
// When you reconnect such compromised device, navigation to modal is handled in the `deviceActions.connectDevice` predicate.
deviceConnectionMiddleware.startListening({
    predicate: action => persistentDeviceDataActions.setDiscoveryEntropyCheckResult.match(action),
    effect: (_action: UnknownAction, { getState }) => {
        if (!navigationContainerRef.isReady()) return;
        const device = selectSelectedDevice(getState());
        if (!device) return;
        const failedCheck = selectCompromisedDeviceFailedCheck(getState(), device);
        if (failedCheck !== 'entropy-discovery') return;
        // One of the blacklisted routes is DeviceCompromisedModal, which means that if we are there already,
        // navigation is not dispatched again.
        if (checkIsActiveRouteAnyOf(DEVICE_CONNECTION_BLACKLISTED_ROUTES)) return;
        if (selectIsFirmwareInstallationRunning(getState())) return;

        navigationContainerRef.navigate(RootStackRoutes.DeviceCompromisedModal, { failedCheck });
    },
});

deviceConnectionMiddleware.startListening({
    predicate: action => deviceActions.deviceDisconnect.match(action),
    effect: (action: UnknownAction, { getState }) => {
        if (!navigationContainerRef.isReady()) return;

        if (!deviceActions.deviceDisconnect.match(action)) {
            throw new Error('This listener only handles deviceDisconnect action');
        }

        const isFirmwareInstallationRunning = selectIsFirmwareInstallationRunning(getState());
        const wasDeviceConnectedViaBluetooth = getIsDeviceDescriptorApiTypeBluetooth(
            action.payload,
        );

        if (
            checkIsActiveRouteAnyOf(DEVICE_DISCONNECTION_BLACKLISTED_ROUTES) ||
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
            // Exclude stacks using useDeviceConnectionGuard to prevent navigation glitches.
            checkIsActiveRouteAnyOf([
                DeviceSettingsStackRoutes.DeviceNameStack,
                DeviceSettingsStackRoutes.FirmwareUpdateStack,
                DeviceSettingsStackRoutes.FirmwareLanguageStack,
                DeviceSettingsStackRoutes.DevicePinProtectionStack,
                DeviceSettingsStackRoutes.DeviceCheckBackupStack,
                DeviceSettingsStackRoutes.DevicePassphraseStack,
                DeviceSettingsStackRoutes.DeviceAuthenticityStack,
                DeviceSettingsStackRoutes.WipeDeviceStack,
                RootStackRoutes.SignAndVerifyStack,
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

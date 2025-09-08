import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { useNavigation, useNavigationState } from '@react-navigation/native';
import { useAtomValue } from 'jotai';

import { selectIsThpInProgress, selectThpStep } from '@suite-common/thp';
import {
    selectIsDeviceConnected,
    selectIsDeviceInitialized,
    selectIsDeviceThpRequired,
    selectIsPortfolioTrackerDevice,
} from '@suite-common/wallet-core';
import { useIsBiometricsOverlayVisible } from '@suite-native/biometrics';
import { selectDeviceRequestedPin } from '@suite-native/device-authorization';
import { selectIsFirmwareInstallationRunning } from '@suite-native/firmware';
import {
    AuthorizeDeviceStackRoutes,
    DeviceOnboardingStackRoutes,
    HomeStackRoutes,
    RootStackParamList,
    RootStackRoutes,
    StackNavigationProps,
    useNavigationRouteMatch,
} from '@suite-native/navigation';
import { selectIsOnboardingFinished } from '@suite-native/settings';

import {
    isOnboardingDeviceDisconnectedAlertDisplayedAtom,
    wasDeviceOnboardingCancelledAtom,
} from '../deviceAtoms';
import { selectIsDeviceCompromised, selectIsDeviceSetupSupported } from '../selectors';

type NavigationProp = StackNavigationProps<RootStackParamList, RootStackRoutes>;

const pinMatrixBlacklistedScreens = [
    RootStackRoutes.DeviceSettingsStack,
    RootStackRoutes.DeviceOnboardingStack,
];

export const useHandleDeviceConnection = () => {
    const isPortfolioTrackerDevice = useSelector(selectIsPortfolioTrackerDevice);
    const isOnboardingFinished = useSelector(selectIsOnboardingFinished);
    const hasDeviceRequestedPin = useSelector(selectDeviceRequestedPin);
    const isDeviceConnected = useSelector(selectIsDeviceConnected);
    const isDeviceInitialized = useSelector(selectIsDeviceInitialized);
    const isDeviceThpRequired = useSelector(selectIsDeviceThpRequired);
    const isThpInProgress = useSelector(selectIsThpInProgress);
    const thpStep = useSelector(selectThpStep);
    const isFirmwareInstallationRunning = useSelector(selectIsFirmwareInstallationRunning);
    const isDeviceSetupSupported = useSelector(selectIsDeviceSetupSupported);
    const isDeviceCompromised = useSelector(selectIsDeviceCompromised);

    const { isBiometricsOverlayVisible } = useIsBiometricsOverlayVisible();
    const isOnboardingDeviceDisconnectedAlertDisplayed = useAtomValue(
        isOnboardingDeviceDisconnectedAlertDisplayedAtom,
    );

    const wasDeviceOnboardingCancelled = useAtomValue(wasDeviceOnboardingCancelledAtom);

    const navigation = useNavigation<NavigationProp>();
    const dispatch = useDispatch();

    const isDeviceOnboardingConnectAndUnlockScreenFocused = useNavigationRouteMatch(
        DeviceOnboardingStackRoutes.ConnectAndUnlockDevice,
    );

    const lastRoute = useNavigationState(state => state.routes.at(-1)?.name);
    const isDeviceOnboardingStackFocused = lastRoute === RootStackRoutes.DeviceOnboardingStack;
    const isOnPinMatrixBlacklistedRoute = pinMatrixBlacklistedScreens.includes(
        lastRoute as RootStackRoutes,
    );

    // Nothing can be accomplished before a THP connection is established.
    useEffect(() => {
        if (
            isOnboardingFinished &&
            !isFirmwareInstallationRunning &&
            (thpStep === 'ConfirmConnectionBeforePairing' || thpStep === 'ConfirmOnlyConnection')
        ) {
            navigation.navigate(RootStackRoutes.AuthorizeDeviceStack, {
                screen: AuthorizeDeviceStackRoutes.ThpConfirmation,
            });
        }
    }, [isOnboardingFinished, isFirmwareInstallationRunning, thpStep, navigation]);

    // When is an uninitialized device model that supports device setup, navigate to device onboarding.
    useEffect(() => {
        if (
            isDeviceSetupSupported &&
            isDeviceConnected &&
            isOnboardingFinished &&
            !isDeviceInitialized &&
            !isDeviceThpRequired &&
            !isThpInProgress &&
            !isPortfolioTrackerDevice &&
            !isBiometricsOverlayVisible &&
            !isOnboardingDeviceDisconnectedAlertDisplayed &&
            !isFirmwareInstallationRunning &&
            (!isDeviceOnboardingStackFocused || isDeviceOnboardingConnectAndUnlockScreenFocused) &&
            !wasDeviceOnboardingCancelled &&
            !isDeviceCompromised
        ) {
            // If THP confirmation screen was shown, we want to prevent swiping/navigating back to
            // that THP confirmation screen. Swiping/navigating back shall lead to the Home screen.
            navigation.reset({
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
    }, [
        dispatch,
        isDeviceConnected,
        isOnboardingFinished,
        isBiometricsOverlayVisible,
        navigation,
        isDeviceInitialized,
        isDeviceThpRequired,
        isThpInProgress,
        isPortfolioTrackerDevice,
        isDeviceSetupSupported,
        isDeviceOnboardingStackFocused,
        isFirmwareInstallationRunning,
        isOnboardingDeviceDisconnectedAlertDisplayed,
        isDeviceOnboardingConnectAndUnlockScreenFocused,
        wasDeviceOnboardingCancelled,
        isDeviceCompromised,
    ]);

    // When trezor gets locked, it is necessary to display a PIN matrix for T1 so that it can be unlocked
    // and then continue with the interaction. For T2, PIN is entered on device, but the screen is still displayed.
    useEffect(() => {
        if (isOnboardingFinished && hasDeviceRequestedPin && !isOnPinMatrixBlacklistedRoute) {
            navigation.navigate(RootStackRoutes.AuthorizeDeviceStack, {
                screen: AuthorizeDeviceStackRoutes.PinMatrix,
            });
        }
    }, [isOnboardingFinished, hasDeviceRequestedPin, isOnPinMatrixBlacklistedRoute, navigation]);
};

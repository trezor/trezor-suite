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
    AppTabsRoutes,
    AuthorizeDeviceStackRoutes,
    DeviceOnboardingStackRoutes,
    HomeStackRoutes,
    RootStackParamList,
    RootStackRoutes,
    StackNavigationProps,
    useNavigateToInitialScreen,
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
    const navigateToInitialScreen = useNavigateToInitialScreen();

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
    const isAuthorizeDeviceStackFocused = lastRoute === RootStackRoutes.AuthorizeDeviceStack;
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
            if (!wasDeviceOnboardingCancelled) {
                navigation.navigate(RootStackRoutes.DeviceOnboardingStack, {
                    screen: DeviceOnboardingStackRoutes.UninitializedDeviceLanding,
                });
            } else if (isAuthorizeDeviceStackFocused) {
                // This ensures that THP-related screens are dismissed after a THP connection.
                // Dismissing them any other way caused navigation glitches.
                navigation.navigate(RootStackRoutes.AppTabs, {
                    screen: AppTabsRoutes.HomeStack,
                    params: {
                        screen: HomeStackRoutes.Home,
                    },
                });
            }
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
        isAuthorizeDeviceStackFocused,
        navigateToInitialScreen,
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

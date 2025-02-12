import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { useNavigation, useNavigationState } from '@react-navigation/native';

import {
    authorizeDeviceThunk,
    selectIsDeviceConnected,
    selectIsDeviceConnectedAndAuthorized,
    selectIsDeviceInitialized,
    selectIsDeviceRemembered,
    selectIsDeviceUsingPassphrase,
    selectIsFirmwareAuthenticityCheckDismissed,
    selectIsNoPhysicalDeviceConnected,
    selectIsPortfolioTrackerDevice,
} from '@suite-common/wallet-core';
import { useIsBiometricsOverlayVisible } from '@suite-native/biometrics';
import { selectDeviceRequestedPin } from '@suite-native/device-authorization';
import { requestPrioritizedDeviceAccess } from '@suite-native/device-mutex';
import { selectIsFirmwareInstallationRunning } from '@suite-native/firmware';
import {
    AppTabsRoutes,
    AuthorizeDeviceStackParamList,
    AuthorizeDeviceStackRoutes,
    HomeStackRoutes,
    OnboardingStackRoutes,
    RootStackParamList,
    RootStackRoutes,
    StackToStackCompositeNavigationProps,
    useNavigationRouteMatch,
} from '@suite-native/navigation';
import { selectIsOnboardingFinished } from '@suite-native/settings';

import {
    selectHasFirmwareAuthenticityCheckHardFailed,
    selectIsDeviceSetupSupported,
} from '../selectors';

type NavigationProp = StackToStackCompositeNavigationProps<
    AuthorizeDeviceStackParamList | RootStackParamList,
    AuthorizeDeviceStackRoutes.PinMatrix | RootStackRoutes.OnboardingStack,
    RootStackParamList
>;

export const useHandleDeviceConnection = () => {
    const isNoPhysicalDeviceConnected = useSelector(selectIsNoPhysicalDeviceConnected);
    const isPortfolioTrackerDevice = useSelector(selectIsPortfolioTrackerDevice);
    const isOnboardingFinished = useSelector(selectIsOnboardingFinished);
    const isDeviceRemembered = useSelector(selectIsDeviceRemembered);
    const isDeviceConnectedAndAuthorized = useSelector(selectIsDeviceConnectedAndAuthorized);
    const hasDeviceRequestedPin = useSelector(selectDeviceRequestedPin);
    const isDeviceConnected = useSelector(selectIsDeviceConnected);
    const isDeviceInitialized = useSelector(selectIsDeviceInitialized);
    const isDeviceUsingPassphrase = useSelector(selectIsDeviceUsingPassphrase);
    const isFirmwareInstallationRunning = useSelector(selectIsFirmwareInstallationRunning);
    const isDeviceSetupSupported = useSelector(selectIsDeviceSetupSupported);

    const { isBiometricsOverlayVisible } = useIsBiometricsOverlayVisible();

    const hasFirmwareAuthenticityCheckHardFailed = useSelector(
        selectHasFirmwareAuthenticityCheckHardFailed,
    );
    const isFirmwareAuthenticityCheckDismissed = useSelector(
        selectIsFirmwareAuthenticityCheckDismissed,
    );
    const shouldNavigateToDeviceCompromisedModal =
        hasFirmwareAuthenticityCheckHardFailed && !isFirmwareAuthenticityCheckDismissed;

    const navigation = useNavigation<NavigationProp>();
    const dispatch = useDispatch();

    // We encourage user to disconnect device when he is redirected to suspicious device screen.
    // We should not redirect him away so he can read the screen content and decide what to do.
    // If the device is connected again, he still should stay on that screen.
    const isSuspiciousDeviceScreenFocused = useNavigationRouteMatch(
        OnboardingStackRoutes.SuspiciousDevice,
    );

    const lastRoute = useNavigationState(state => state?.routes.at(-1)?.name);
    const isDeviceSettingsStackFocused = lastRoute === RootStackRoutes.DeviceSettingsStack;
    const isSendStackFocused = lastRoute === RootStackRoutes.SendStack;
    const shouldBlockSendReviewRedirect = isDeviceRemembered && isSendStackFocused;
    const isDeviceCompromisedModalFocused =
        lastRoute === RootStackRoutes.DeviceCompromisedModalScreen;

    // When is an uninitialized device model that supports device setup, navigate to device onboarding.
    useEffect(() => {
        if (isSuspiciousDeviceScreenFocused) return;
        if (
            isDeviceSetupSupported &&
            !isDeviceInitialized &&
            isDeviceConnected &&
            isOnboardingFinished &&
            !isPortfolioTrackerDevice &&
            !isBiometricsOverlayVisible
        ) {
            requestPrioritizedDeviceAccess({
                deviceCallback: () => dispatch(authorizeDeviceThunk()),
            });

            if (!isDeviceInitialized) {
                navigation.navigate(RootStackRoutes.OnboardingStack, {
                    screen: OnboardingStackRoutes.UninitializedDeviceLanding,
                });

                return;
            }
        }
    }, [
        dispatch,
        isDeviceConnected,
        isOnboardingFinished,
        isBiometricsOverlayVisible,
        isSuspiciousDeviceScreenFocused,
        navigation,
        isDeviceInitialized,
        isPortfolioTrackerDevice,
        isDeviceSetupSupported,
    ]);

    // At the moment when unauthorized physical device is selected,
    // redirect to the Connecting screen where is handled the connection logic.
    useEffect(() => {
        if (isFirmwareInstallationRunning || isSuspiciousDeviceScreenFocused) return;

        if (
            isDeviceConnected &&
            isOnboardingFinished &&
            !isPortfolioTrackerDevice &&
            !isDeviceConnectedAndAuthorized &&
            !isBiometricsOverlayVisible &&
            !shouldNavigateToDeviceCompromisedModal &&
            !isDeviceSetupSupported
        ) {
            requestPrioritizedDeviceAccess({
                deviceCallback: () => dispatch(authorizeDeviceThunk()),
            });

            // Note: Passphrase protected device (excluding empty passphrase, e. g. standard wallet with passphrase protection on device),
            // post auth navigation is handled in @suite-native/module-passphrase for custom UX flow.
            if (!isDeviceUsingPassphrase && !shouldBlockSendReviewRedirect) {
                navigation.navigate(RootStackRoutes.AuthorizeDeviceStack, {
                    screen: AuthorizeDeviceStackRoutes.ConnectingDevice,
                });
            }
        }
        if (shouldNavigateToDeviceCompromisedModal) {
            navigation.navigate(RootStackRoutes.DeviceCompromisedModalScreen);
        }
    }, [
        dispatch,
        isDeviceConnected,
        isOnboardingFinished,
        isPortfolioTrackerDevice,
        isNoPhysicalDeviceConnected,
        isDeviceConnectedAndAuthorized,
        isBiometricsOverlayVisible,
        navigation,
        isDeviceUsingPassphrase,
        shouldBlockSendReviewRedirect,
        isFirmwareInstallationRunning,
        isDeviceInitialized,
        shouldNavigateToDeviceCompromisedModal,
        isDeviceSetupSupported,
        isSuspiciousDeviceScreenFocused,
    ]);

    // In case that the physical device is disconnected, redirect to the home screen and
    // set connecting screen to be displayed again on the next device connection.
    useEffect(() => {
        if (isFirmwareInstallationRunning) return;

        if (isNoPhysicalDeviceConnected && isOnboardingFinished) {
            if (shouldBlockSendReviewRedirect) {
                return;
            }
            // DeviceCompromisedModal is persistent, so postpone navigating to away until it's dismissed
            // TODO: this hook is getting very complex, and it's hard to understand the logic when it navigates there and back again.
            //  Ideally there'd be a single source of truth, a function returning "where we should be as per current state"
            //  rather than multiple useEffects with imperative instructions "go there when X changes"
            if (isDeviceCompromisedModalFocused || isSuspiciousDeviceScreenFocused) {
                return;
            }
            navigation.navigate(RootStackRoutes.AppTabs, {
                screen: AppTabsRoutes.HomeStack,
                params: {
                    screen: HomeStackRoutes.Home,
                },
            });
        }
    }, [
        isNoPhysicalDeviceConnected,
        isOnboardingFinished,
        navigation,
        shouldBlockSendReviewRedirect,
        isFirmwareInstallationRunning,
        isDeviceCompromisedModalFocused,
        isSuspiciousDeviceScreenFocused,
    ]);

    // When trezor gets locked, it is necessary to display a PIN matrix for T1 so that it can be unlocked
    // and then continue with the interaction. For T2, PIN is entered on device, but the screen is still displayed.
    useEffect(() => {
        if (isOnboardingFinished && hasDeviceRequestedPin && !isDeviceSettingsStackFocused) {
            navigation.navigate(RootStackRoutes.AuthorizeDeviceStack, {
                screen: AuthorizeDeviceStackRoutes.PinMatrix,
            });
        }
    }, [isOnboardingFinished, hasDeviceRequestedPin, isDeviceSettingsStackFocused, navigation]);
};

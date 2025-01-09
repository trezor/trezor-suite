import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

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

    const lastRoute = navigation.getState()?.routes.at(-1)?.name;
    const isDeviceSettingsStackFocused = lastRoute === RootStackRoutes.DeviceSettingsStack;
    const isSendStackFocused = lastRoute === RootStackRoutes.SendStack;
    const shouldBlockSendReviewRedirect = isDeviceRemembered && isSendStackFocused;
    const isDeviceCompromisedModalFocused =
        lastRoute === RootStackRoutes.DeviceCompromisedModalScreen;

    // When is an uninitialized device model that supports device setup, navigate to device onboarding.
    useEffect(() => {
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
        navigation,
        isDeviceInitialized,
        isPortfolioTrackerDevice,
        isDeviceSetupSupported,
    ]);

    // At the moment when unauthorized physical device is selected,
    // redirect to the Connecting screen where is handled the connection logic.
    useEffect(() => {
        if (isFirmwareInstallationRunning) return;

        if (
            isDeviceInitialized &&
            isDeviceConnected &&
            isOnboardingFinished &&
            !isPortfolioTrackerDevice &&
            !isDeviceConnectedAndAuthorized &&
            !isBiometricsOverlayVisible &&
            !shouldNavigateToDeviceCompromisedModal
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
            if (isDeviceCompromisedModalFocused) {
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

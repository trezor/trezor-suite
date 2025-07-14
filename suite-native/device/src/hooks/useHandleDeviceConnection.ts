import { useEffect } from 'react';
import { useSelector } from 'react-redux';

import { useNavigation, useNavigationState } from '@react-navigation/native';

import {
    selectIsDeviceRemembered,
    selectIsNoPhysicalDeviceConnected,
} from '@suite-common/wallet-core';
import { selectDeviceRequestedPin } from '@suite-native/device-authorization';
import { selectIsFirmwareInstallationRunning } from '@suite-native/firmware';
import {
    AppTabsRoutes,
    AuthorizeDeviceStackParamList,
    AuthorizeDeviceStackRoutes,
    DeviceOnboardingStackRoutes,
    HomeStackRoutes,
    RootStackParamList,
    RootStackRoutes,
    StackToStackCompositeNavigationProps,
    useNavigationRouteMatch,
} from '@suite-native/navigation';
import { selectIsOnboardingFinished } from '@suite-native/settings';

import { useDeviceChecks } from './useDeviceChecks';

type NavigationProp = StackToStackCompositeNavigationProps<
    AuthorizeDeviceStackParamList | RootStackParamList,
    AuthorizeDeviceStackRoutes.PinMatrix | RootStackRoutes.OnboardingStack,
    RootStackParamList
>;

const pinMatrixBlacklistedScreens = [
    RootStackRoutes.DeviceSettingsStack,
    RootStackRoutes.DeviceOnboardingStack,
];

export const useHandleDeviceConnection = () => {
    const isNoPhysicalDeviceConnected = useSelector(selectIsNoPhysicalDeviceConnected);
    const isOnboardingFinished = useSelector(selectIsOnboardingFinished);
    const isDeviceRemembered = useSelector(selectIsDeviceRemembered);
    const hasDeviceRequestedPin = useSelector(selectDeviceRequestedPin);
    const isFirmwareInstallationRunning = useSelector(selectIsFirmwareInstallationRunning);

    const navigation = useNavigation<NavigationProp>();

    // We encourage user to disconnect device when he is redirected to suspicious device screen.
    // We should not redirect him away so he can read the screen content and decide what to do.
    // If the device is connected again, he still should stay on that screen.
    const isSuspiciousDeviceScreenFocused = useNavigationRouteMatch(
        DeviceOnboardingStackRoutes.SuspiciousDevice,
    );

    const lastRoute = useNavigationState(state => state?.routes.at(-1)?.name);
    const isSendStackFocused = lastRoute === RootStackRoutes.SendStack;
    const isOnboardingStackFocused = lastRoute === RootStackRoutes.OnboardingStack;
    const isDeviceOnboardingStackFocused = lastRoute === RootStackRoutes.DeviceOnboardingStack;
    const shouldBlockSendReviewRedirect = isDeviceRemembered && isSendStackFocused;
    const isDeviceCompromisedModalFocused = lastRoute === RootStackRoutes.DeviceCompromisedModal;
    const isOnPinMatrixBlacklistedRoute = pinMatrixBlacklistedScreens.includes(
        lastRoute as RootStackRoutes,
    );

    const { shouldKeepDeviceCompromisedModal } = useDeviceChecks(isDeviceCompromisedModalFocused);

    // In case that the physical device is disconnected, redirect to the home screen and
    // set connecting screen to be displayed again on the next device connection.
    useEffect(() => {
        if (isFirmwareInstallationRunning || !isOnboardingFinished) return;

        if (isNoPhysicalDeviceConnected) {
            if (shouldBlockSendReviewRedirect) {
                return;
            }
            // DeviceCompromisedModal is persistent, so postpone navigating to away until it's dismissed
            // TODO: this hook is getting very complex, and it's hard to understand the logic when it navigates there and back again.
            //  Ideally there'd be a single source of truth, a function returning "where we should be as per current state"
            //  rather than multiple useEffects with imperative instructions "go there when X changes"
            if (shouldKeepDeviceCompromisedModal || isSuspiciousDeviceScreenFocused) {
                return;
            }

            if (isDeviceOnboardingStackFocused) {
                navigation.navigate(RootStackRoutes.DeviceOnboardingStack, {
                    screen: DeviceOnboardingStackRoutes.ConnectAndUnlockDevice,
                });

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
        shouldKeepDeviceCompromisedModal,
        isSuspiciousDeviceScreenFocused,
        isOnboardingStackFocused,
        isDeviceOnboardingStackFocused,
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

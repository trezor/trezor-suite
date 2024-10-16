import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import {
    AppTabsRoutes,
    AuthorizeDeviceStackParamList,
    AuthorizeDeviceStackRoutes,
    HomeStackRoutes,
    RootStackParamList,
    RootStackRoutes,
    StackToStackCompositeNavigationProps,
} from '@suite-native/navigation';
import {
    selectIsPortfolioTrackerDevice,
    selectIsDeviceConnected,
    selectIsDeviceConnectedAndAuthorized,
    selectIsNoPhysicalDeviceConnected,
    selectIsDeviceUsingPassphrase,
    authorizeDeviceThunk,
    selectIsDeviceRemembered,
} from '@suite-common/wallet-core';
import { selectDeviceRequestedPin } from '@suite-native/device-authorization';
import { selectIsOnboardingFinished } from '@suite-native/settings';
import { requestPrioritizedDeviceAccess } from '@suite-native/device-mutex';
import { useIsBiometricsOverlayVisible } from '@suite-native/biometrics';

type NavigationProp = StackToStackCompositeNavigationProps<
    AuthorizeDeviceStackParamList | RootStackParamList,
    AuthorizeDeviceStackRoutes.PinMatrix | RootStackRoutes.Onboarding,
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
    const { isBiometricsOverlayVisible } = useIsBiometricsOverlayVisible();
    const isDeviceUsingPassphrase = useSelector(selectIsDeviceUsingPassphrase);
    const navigation = useNavigation<NavigationProp>();
    const dispatch = useDispatch();

    const lastRoute = navigation.getState()?.routes.at(-1)?.name;
    const isDeviceSettingsStackFocused = lastRoute === RootStackRoutes.DeviceSettingsStack;
    const isSendStackFocused = lastRoute === RootStackRoutes.SendStack;
    const shouldBlockSendReviewRedirect = isDeviceRemembered && isSendStackFocused;

    // At the moment when unauthorized physical device is selected,
    // redirect to the Connecting screen where is handled the connection logic.
    useEffect(() => {
        if (
            isDeviceConnected &&
            isOnboardingFinished &&
            !isPortfolioTrackerDevice &&
            !isDeviceConnectedAndAuthorized &&
            !isBiometricsOverlayVisible
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
    ]);

    // In case that the physical device is disconnected, redirect to the home screen and
    // set connecting screen to be displayed again on the next device connection.
    useEffect(() => {
        if (isNoPhysicalDeviceConnected && isOnboardingFinished) {
            const previousRoute = navigation.getState()?.routes.at(-1)?.name;

            // This accidentally gets triggered by finishing onboarding with no device connected,
            // so this prevents from redirect being duplicated.
            const isPreviousRouteOnboarding = previousRoute === RootStackRoutes.Onboarding;
            if (isPreviousRouteOnboarding || shouldBlockSendReviewRedirect) {
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

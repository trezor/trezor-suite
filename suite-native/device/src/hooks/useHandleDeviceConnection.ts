import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import {
    AppTabsRoutes,
    ConnectDeviceStackParamList,
    ConnectDeviceStackRoutes,
    HomeStackRoutes,
    RootStackParamList,
    RootStackRoutes,
    StackToStackCompositeNavigationProps,
} from '@suite-native/navigation';
import {
    authorizeDevice,
    selectIsPortfolioTrackerDevice,
    selectDeviceRequestedPin,
    selectIsDeviceConnectedAndAuthorized,
    selectIsNoPhysicalDeviceConnected,
} from '@suite-common/wallet-core';
import { selectIsOnboardingFinished } from '@suite-native/module-settings';
import { requestPrioritizedDeviceAccess } from '@suite-native/device-mutex';
import { useIsBiometricsOverlayVisible } from '@suite-native/biometrics';

type NavigationProp = StackToStackCompositeNavigationProps<
    ConnectDeviceStackParamList | RootStackParamList,
    ConnectDeviceStackRoutes.PinMatrix | RootStackRoutes.Onboarding,
    RootStackParamList
>;

export const useHandleDeviceConnection = () => {
    const isNoPhysicalDeviceConnected = useSelector(selectIsNoPhysicalDeviceConnected);
    const isPortfolioTrackerDevice = useSelector(selectIsPortfolioTrackerDevice);
    const isOnboardingFinished = useSelector(selectIsOnboardingFinished);
    const isDeviceConnectedAndAuthorized = useSelector(selectIsDeviceConnectedAndAuthorized);
    const hasDeviceRequestedPin = useSelector(selectDeviceRequestedPin);
    const { isBiometricsOverlayVisible } = useIsBiometricsOverlayVisible();

    const navigation = useNavigation<NavigationProp>();
    const dispatch = useDispatch();

    // At the moment when unauthorized physical device is selected,
    // redirect to the Connecting screen where is handled the connection logic.
    useEffect(() => {
        if (
            isOnboardingFinished &&
            !isPortfolioTrackerDevice &&
            !isDeviceConnectedAndAuthorized &&
            !isBiometricsOverlayVisible
        ) {
            requestPrioritizedDeviceAccess(() => dispatch(authorizeDevice()));
            navigation.navigate(RootStackRoutes.ConnectDevice, {
                screen: ConnectDeviceStackRoutes.ConnectingDevice,
            });
        }
    }, [
        dispatch,
        isOnboardingFinished,
        isPortfolioTrackerDevice,
        isNoPhysicalDeviceConnected,
        isDeviceConnectedAndAuthorized,
        isBiometricsOverlayVisible,
        navigation,
    ]);

    // In case that the physical device is disconnected, redirect to the home screen and
    // set connecting screen to be displayed again on the next device connection.
    useEffect(() => {
        if (isNoPhysicalDeviceConnected && isOnboardingFinished) {
            // This accidentally gets triggered by finishing onboarding with no device connected,
            // so this prevents from redirect being duplicated.
            const isPreviousRouteOnboarding =
                navigation.getState()?.routes.at(-1)?.name === RootStackRoutes.Onboarding;
            if (isPreviousRouteOnboarding) {
                return;
            }
            navigation.navigate(RootStackRoutes.AppTabs, {
                screen: AppTabsRoutes.HomeStack,
                params: {
                    screen: HomeStackRoutes.Home,
                },
            });
        }
    }, [isNoPhysicalDeviceConnected, isOnboardingFinished, navigation]);

    // When trezor gets locked, it is necessary to display a PIN matrix for T1 so that it can be unlocked
    // and then continue with the interaction. For T2, PIN is entered on device, but the screen is still displayed.
    useEffect(() => {
        if (isOnboardingFinished && hasDeviceRequestedPin) {
            navigation.navigate(RootStackRoutes.ConnectDevice, {
                screen: ConnectDeviceStackRoutes.PinMatrix,
            });
        }
    }, [hasDeviceRequestedPin, isOnboardingFinished, navigation]);
};

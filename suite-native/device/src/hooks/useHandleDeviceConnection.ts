import { useEffect } from 'react';
import { useSelector } from 'react-redux';

import { useNavigation, useNavigationState } from '@react-navigation/native';

import { selectDeviceRequestedPin } from '@suite-native/device-authorization';
import { selectIsOnboardingDeviceDisconnectedAlertDisplayed } from '@suite-native/device-onboarding';
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

type NavigationProp = StackNavigationProps<RootStackParamList, RootStackRoutes>;

const pinMatrixBlacklistedScreens = [
    RootStackRoutes.DeviceSettingsStack,
    RootStackRoutes.DeviceOnboardingStack,
];

export const useHandleDeviceConnection = () => {
    const isOnboardingFinished = useSelector(selectIsOnboardingFinished);
    const hasDeviceRequestedPin = useSelector(selectDeviceRequestedPin);

    const isOnboardingDeviceDisconnectedAlertDisplayed = useSelector(
        selectIsOnboardingDeviceDisconnectedAlertDisplayed,
    );

    const navigation = useNavigation<NavigationProp>();

    const isDeviceOnboardingConnectAndUnlockScreenFocused = useNavigationRouteMatch(
        DeviceOnboardingStackRoutes.ConnectAndUnlockDevice,
    );

    const lastRoute = useNavigationState(state => state.routes.at(-1)?.name);
    const isDeviceOnboardingStackFocused = lastRoute === RootStackRoutes.DeviceOnboardingStack;
    const isOnPinMatrixBlacklistedRoute = pinMatrixBlacklistedScreens.includes(
        lastRoute as RootStackRoutes,
    );

    // When is an uninitialized device model that supports device setup, navigate to device onboarding.
    useEffect(() => {
        if (
            !isOnboardingDeviceDisconnectedAlertDisplayed &&
            (!isDeviceOnboardingStackFocused || isDeviceOnboardingConnectAndUnlockScreenFocused)
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
        isDeviceOnboardingConnectAndUnlockScreenFocused,
        isDeviceOnboardingStackFocused,
        isOnboardingDeviceDisconnectedAlertDisplayed,
        navigation,
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

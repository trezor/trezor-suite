import { useEffect } from 'react';
import { useSelector } from 'react-redux';

import { useNavigation, useNavigationState } from '@react-navigation/native';

import { selectDeviceRequestedPin } from '@suite-native/device-authorization';
import {
    AuthorizeDeviceStackRoutes,
    RootStackParamList,
    RootStackRoutes,
    StackNavigationProps,
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

    const navigation = useNavigation<NavigationProp>();

    const lastRoute = useNavigationState(state => state.routes.at(-1)?.name);
    const isOnPinMatrixBlacklistedRoute = pinMatrixBlacklistedScreens.includes(
        lastRoute as RootStackRoutes,
    );

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

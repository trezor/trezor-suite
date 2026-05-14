import { useEffect } from 'react';
import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import {
    type AuthorizeDeviceStackParamList,
    AuthorizeDeviceStackRoutes,
    type RootStackParamList,
    RootStackRoutes,
    type StackToStackCompositeNavigationProps,
    useLastRouteName,
} from '@suite-native/navigation';

import {
    DeviceAuthorizationStep,
    selectDeviceAuthorizationStep,
} from '../deviceAuthorizationSlice';

type NavigationProp = StackToStackCompositeNavigationProps<
    AuthorizeDeviceStackParamList,
    AuthorizeDeviceStackRoutes,
    RootStackParamList
>;

const pinMatrixBlacklistedScreens = [
    RootStackRoutes.DeviceSettingsStack,
    RootStackRoutes.DeviceOnboardingStack,
];

export const useHandleDeviceAuthorization = () => {
    const navigation = useNavigation<NavigationProp>();
    const lastRoute = useLastRouteName();

    const deviceAuthorizationStep = useSelector(selectDeviceAuthorizationStep);

    const isOnPinMatrixBlacklistedRoute = pinMatrixBlacklistedScreens.includes(
        lastRoute as RootStackRoutes,
    );

    useEffect(() => {
        switch (deviceAuthorizationStep) {
            case DeviceAuthorizationStep.PinRequested:
                // When trezor gets locked, it is necessary to display a PIN matrix for T1 so that it can be unlocked
                // and then continue with the interaction. For non-T1 devices, PIN is entered on device, but the screen is still displayed.
                if (!isOnPinMatrixBlacklistedRoute) {
                    navigation.navigate(RootStackRoutes.AuthorizeDeviceStack, {
                        screen: AuthorizeDeviceStackRoutes.PinMatrix,
                    });

                    return;
                }
                break;
            case DeviceAuthorizationStep.PassphraseRequested:
                // Feature requests passphrase
                navigation.navigate(RootStackRoutes.AuthorizeDeviceStack, {
                    screen: AuthorizeDeviceStackRoutes.PassphraseForm,
                });
                break;
            case DeviceAuthorizationStep.ContinueOnTrezorRequested:
                navigation.navigate(RootStackRoutes.AuthorizeDeviceStack, {
                    screen: AuthorizeDeviceStackRoutes.ContinueOnTrezor,
                });
                break;
            default:
                return;
        }
    }, [deviceAuthorizationStep, isOnPinMatrixBlacklistedRoute, navigation]);
};

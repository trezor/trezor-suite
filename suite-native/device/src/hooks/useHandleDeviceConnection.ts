import { useEffect } from 'react';
import { useSelector } from 'react-redux';

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
    selectIsSelectedDeviceImported,
    selectIsNoPhysicalDeviceConnected,
    selectIsDeviceConnectedAndAuthorized,
} from '@suite-common/wallet-core';
import { selectIsOnboardingFinished } from '@suite-native/module-settings';

type NavigationProp = StackToStackCompositeNavigationProps<
    ConnectDeviceStackParamList | RootStackParamList,
    ConnectDeviceStackRoutes.PinMatrix | RootStackRoutes.Onboarding,
    RootStackParamList
>;

export const useHandleDeviceConnection = () => {
    const isNoPhysicalDeviceConnected = useSelector(selectIsNoPhysicalDeviceConnected);
    const isSelectedDeviceImported = useSelector(selectIsSelectedDeviceImported);
    const isOnboardingFinished = useSelector(selectIsOnboardingFinished);
    const isDeviceConnectedAndAuthorized = useSelector(selectIsDeviceConnectedAndAuthorized);

    const navigation = useNavigation<NavigationProp>();

    // At the moment when unauthorized physical device is selected,
    // redirect to the Connecting screen where is handled the connection logic.
    useEffect(() => {
        if (isOnboardingFinished && !isSelectedDeviceImported && !isDeviceConnectedAndAuthorized) {
            navigation.navigate(RootStackRoutes.ConnectDevice, {
                screen: ConnectDeviceStackRoutes.ConnectingDevice,
            });
        }
    }, [
        isOnboardingFinished,
        isSelectedDeviceImported,
        isNoPhysicalDeviceConnected,
        isDeviceConnectedAndAuthorized,
        navigation,
    ]);

    // In case that the physical device is disconnected, redirect to the home screen and
    // set connecting screen to be displayed again on the next device connection.
    useEffect(() => {
        if (isNoPhysicalDeviceConnected && isOnboardingFinished) {
            // This accidentally gets triggered by finishing onboarding with no device connected,
            // so this prevents from redirect being duplicated.
            const isPreviousRouteOnboarding =
                navigation.getState()?.routes[navigation.getState().routes.length - 1].name ===
                RootStackRoutes.Onboarding;
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
};

import { useCallback } from 'react';
import { useSelector } from 'react-redux';

import { useFocusEffect, useNavigation } from '@react-navigation/native';

import { selectIsDeviceConnected } from '@suite-common/wallet-core';
import {
    AuthorizeDeviceStackRoutes,
    DeviceStackRoutes,
    RootStackParamList,
    RootStackRoutes,
    SettingsStackParamList,
    StackToStackCompositeNavigationProps,
} from '@suite-native/navigation';

type NavigationProps = StackToStackCompositeNavigationProps<
    SettingsStackParamList,
    DeviceStackRoutes.DeviceSettings,
    RootStackParamList
>;

export const useDeviceConnectionGuard = () => {
    const navigation = useNavigation<NavigationProps>();

    const isDeviceConnected = useSelector(selectIsDeviceConnected);

    const redirectToConnectAndUnlockScreen = useCallback(() => {
        navigation.navigate(RootStackRoutes.AuthorizeDeviceStack, {
            screen: AuthorizeDeviceStackRoutes.ConnectAndUnlockDevice,
            params: {
                onCancelNavigationTarget: {
                    name: RootStackRoutes.DeviceSettingsStack,
                    params: { screen: DeviceStackRoutes.DeviceSettings },
                },
            },
        });
    }, [navigation]);

    useFocusEffect(
        useCallback(() => {
            if (!isDeviceConnected) {
                redirectToConnectAndUnlockScreen();
            }
        }, [isDeviceConnected, redirectToConnectAndUnlockScreen]),
    );

    return { isDeviceConnected };
};

import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { useFocusEffect, useNavigation } from '@react-navigation/native';

import { bluetoothActions } from '@suite-common/bluetooth';
import { selectDeviceBluetoothId, selectIsDeviceConnected } from '@suite-common/wallet-core';
import {
    AuthorizeDeviceStackRoutes,
    DeviceSettingsStackRoutes,
    RootStackParamList,
    RootStackRoutes,
    SettingsStackParamList,
    StackToStackCompositeNavigationProps,
} from '@suite-native/navigation';

type NavigationProps = StackToStackCompositeNavigationProps<
    SettingsStackParamList,
    DeviceSettingsStackRoutes.DeviceSettings,
    RootStackParamList
>;

export const useDeviceConnectionGuard = () => {
    const dispatch = useDispatch();
    const navigation = useNavigation<NavigationProps>();

    const isDeviceConnected = useSelector(selectIsDeviceConnected);
    const deviceBluetoothId = useSelector(selectDeviceBluetoothId);

    const navigateToDeviceConnectionGuardScreen = useCallback(() => {
        if (deviceBluetoothId) {
            dispatch(bluetoothActions.enableAutoConnect({ deviceId: deviceBluetoothId }));
        }
        navigation.navigate(RootStackRoutes.AuthorizeDeviceStack, {
            screen: AuthorizeDeviceStackRoutes.DeviceConnectionGuard,
            params: {
                onCancelNavigationTarget: {
                    name: RootStackRoutes.DeviceSettingsStack,
                    params: { screen: DeviceSettingsStackRoutes.DeviceSettings },
                },
            },
        });
    }, [deviceBluetoothId, dispatch, navigation]);

    useFocusEffect(
        useCallback(() => {
            if (!isDeviceConnected) {
                navigateToDeviceConnectionGuardScreen();
            }
        }, [isDeviceConnected, navigateToDeviceConnectionGuardScreen]),
    );

    return { isDeviceConnected };
};

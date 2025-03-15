import { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import { selectSelectedDevice } from '@suite-common/wallet-core';
import {
    AppTabsRoutes,
    DeviceStackRoutes,
    HomeStackRoutes,
    RootStackParamList,
    RootStackRoutes,
    SettingsStackParamList,
    StackToStackCompositeNavigationProps,
} from '@suite-native/navigation';
import TrezorConnect from '@trezor/connect';

type NavigationProps = StackToStackCompositeNavigationProps<
    SettingsStackParamList,
    DeviceStackRoutes.DeviceSettings,
    RootStackParamList
>;

export const useDeviceChangedCheck = () => {
    const device = useSelector(selectSelectedDevice);
    const navigation = useNavigation<NavigationProps>();
    const initialDeviceIdRef = useRef<string | null>(null);

    useEffect(() => {
        // Store the initial device ID when the component mounts
        if (initialDeviceIdRef.current === null && device?.id) {
            initialDeviceIdRef.current = device.id;

            return;
        }

        // Check for device mismatch only after initial device ID is set
        if (initialDeviceIdRef.current && device?.id && initialDeviceIdRef.current !== device.id) {
            TrezorConnect.cancel();
            navigation.navigate(RootStackRoutes.AppTabs, {
                screen: AppTabsRoutes.HomeStack,
                params: {
                    screen: HomeStackRoutes.Home,
                },
            });
        }
    }, [device?.id, navigation]);
};

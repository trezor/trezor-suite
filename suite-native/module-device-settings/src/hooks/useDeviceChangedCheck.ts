import { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import { selectSelectedDevice } from '@suite-common/wallet-core';
import {
    AppTabsRoutes,
    DeviceSettingsStackParamList,
    DeviceSettingsStackRoutes,
    HomeStackRoutes,
    RootStackParamList,
    RootStackRoutes,
    StackToStackCompositeNavigationProps,
} from '@suite-native/navigation';
import TrezorConnect from '@trezor/connect';

type NavigationProps = StackToStackCompositeNavigationProps<
    DeviceSettingsStackParamList,
    DeviceSettingsStackRoutes.DeviceSettings,
    RootStackParamList
>;

// When user accesses device settings in remember mode and tries to modify the device,
// he will be prompted to connect Trezor. This hook prevents usage of incorrect device.
export const useDeviceChangedCheck = () => {
    const device = useSelector(selectSelectedDevice);
    const navigation = useNavigation<NavigationProps>();
    const initialDeviceIdRef = useRef<string | null>(null);
    const hasDeviceBeenConnected = useRef<boolean>(false);

    useEffect(() => {
        // Store the initial device ID when the component mounts
        if (initialDeviceIdRef.current === null && device?.id) {
            initialDeviceIdRef.current = device.id;
            hasDeviceBeenConnected.current = device.connected;

            return;
        }

        // When device is wiped, the device ID changes and we shouldn't trigger this.
        if (
            initialDeviceIdRef.current &&
            device?.id &&
            initialDeviceIdRef.current !== device.id &&
            !hasDeviceBeenConnected.current &&
            !device.connected
        ) {
            TrezorConnect.cancel();
            navigation.navigate(RootStackRoutes.AppTabs, {
                screen: AppTabsRoutes.HomeStack,
                params: {
                    screen: HomeStackRoutes.Home,
                },
            });
        }
    }, [device?.id, navigation, device?.connected]);
};

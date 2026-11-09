import { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import { selectDeviceId, selectIsDeviceConnected } from '@suite-common/device';
import {
    AppTabsRoutes,
    type DeviceSettingsStackParamList,
    type DeviceSettingsStackRoutes,
    HomeStackRoutes,
    type RootStackParamList,
    RootStackRoutes,
    type StackToStackCompositeNavigationProps,
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
    const deviceId = useSelector(selectDeviceId);
    const isDeviceConnected = useSelector(selectIsDeviceConnected);
    const navigation = useNavigation<NavigationProps>();
    const initialDeviceIdRef = useRef<string | null>(null);
    // Important for device wipe. Device ID changes for wiped device, but if it was connected,
    // we know the device was wiped, thus we want to prevent the navigation call.
    const hasDeviceBeenConnected = useRef<boolean>(false);

    useEffect(() => {
        // Store the initial device ID when the component mounts
        if (initialDeviceIdRef.current === null && deviceId) {
            initialDeviceIdRef.current = deviceId;
            hasDeviceBeenConnected.current = isDeviceConnected;

            return;
        }

        if (
            initialDeviceIdRef.current &&
            deviceId &&
            initialDeviceIdRef.current !== deviceId &&
            !hasDeviceBeenConnected.current &&
            isDeviceConnected
        ) {
            TrezorConnect.cancel();
            navigation.popTo(RootStackRoutes.AppTabs, {
                screen: AppTabsRoutes.HomeStack,
                params: {
                    screen: HomeStackRoutes.Home,
                },
            });
        }
    }, [deviceId, navigation, isDeviceConnected]);
};

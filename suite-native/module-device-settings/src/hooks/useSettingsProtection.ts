import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import {
    DeviceRootState,
    DiscoveryRootState,
    selectIsDeviceConnected,
    selectIsDiscoveryActiveByDeviceState,
    selectSelectedDevice,
} from '@suite-common/wallet-core';
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

export const useSettingsProtection = () => {
    const device = useSelector(selectSelectedDevice);
    const navigation = useNavigation<NavigationProps>();

    const isDiscoveryRunning = useSelector((state: DiscoveryRootState & DeviceRootState) =>
        selectIsDiscoveryActiveByDeviceState(state, device?.state),
    );
    const isDeviceConnected = useSelector(selectIsDeviceConnected);

    const handleConnectDevice = () => {
        navigation.navigate(RootStackRoutes.AuthorizeDeviceStack, {
            screen: AuthorizeDeviceStackRoutes.ConnectAndUnlockDevice,
        });
    };

    return { isDiscoveryRunning, isDeviceConnected, handleConnectDevice };
};

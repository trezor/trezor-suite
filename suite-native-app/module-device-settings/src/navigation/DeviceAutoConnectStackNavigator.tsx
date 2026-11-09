import { useCallback, useState } from 'react';

import { useFocusEffect } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import {
    DeviceConnectionGuardScreen,
    useDeviceConnectionGuard,
} from '@suite-native/device-authorization';
import {
    type DeviceAutoConnectStackParamList,
    DeviceAutoConnectStackRoutes,
    stackNavigationOptionsConfig,
} from '@suite-native/navigation';

import { useDeviceAutoConnect } from '../hooks/useDeviceAutoConnect';
import { ContinueOnTrezorScreen } from '../screens/ContinueOnTrezorScreen';

const DeviceAutoConnectStack = createNativeStackNavigator<DeviceAutoConnectStackParamList>();

export const DeviceAutoConnectStackNavigator = () => {
    const { isDeviceConnectionGuardVisible } = useDeviceConnectionGuard();
    const [isEnableAutoconnectStarted, setIsEnableAutoconnectStarted] = useState(false);

    const { enableAutoConnect } = useDeviceAutoConnect();

    useFocusEffect(
        useCallback(() => {
            if (!isDeviceConnectionGuardVisible && !isEnableAutoconnectStarted) {
                setIsEnableAutoconnectStarted(true);
                enableAutoConnect();
            }
        }, [isDeviceConnectionGuardVisible, isEnableAutoconnectStarted, enableAutoConnect]),
    );

    return (
        <DeviceAutoConnectStack.Navigator screenOptions={stackNavigationOptionsConfig}>
            {isDeviceConnectionGuardVisible && (
                <DeviceAutoConnectStack.Screen
                    name={DeviceAutoConnectStackRoutes.DeviceConnectionGuard}
                    component={DeviceConnectionGuardScreen}
                />
            )}
            <DeviceAutoConnectStack.Screen
                name={DeviceAutoConnectStackRoutes.ConfirmAutoConnect}
                component={ContinueOnTrezorScreen}
            />
        </DeviceAutoConnectStack.Navigator>
    );
};

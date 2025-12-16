import { useSelector } from 'react-redux';

import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { selectIsDeviceConnected } from '@suite-common/wallet-core';
import {
    DeviceAutoConnectStackParamList,
    DeviceAutoConnectStackRoutes,
    stackNavigationOptionsConfig,
} from '@suite-native/navigation';

import { ContinueOnTrezorScreen } from '../screens/ContinueOnTrezorScreen';
import { DeviceConnectionGuardScreenWithCancel } from '../screens/DeviceConnectionGuardScreen';

const DeviceAutoConnectStack = createNativeStackNavigator<DeviceAutoConnectStackParamList>();

export const DeviceAutoConnectStackNavigator = () => {
    const isDeviceConnected = useSelector(selectIsDeviceConnected);

    return (
        <DeviceAutoConnectStack.Navigator screenOptions={stackNavigationOptionsConfig}>
            {!isDeviceConnected && (
                <DeviceAutoConnectStack.Screen
                    name={DeviceAutoConnectStackRoutes.DeviceConnectionGuard}
                    component={DeviceConnectionGuardScreenWithCancel}
                />
            )}
            {isDeviceConnected && (
                <DeviceAutoConnectStack.Screen
                    name={DeviceAutoConnectStackRoutes.ConfirmAutoConnect}
                    component={ContinueOnTrezorScreen}
                />
            )}
        </DeviceAutoConnectStack.Navigator>
    );
};

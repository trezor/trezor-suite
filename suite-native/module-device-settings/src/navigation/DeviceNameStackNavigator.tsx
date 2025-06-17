import { createNativeStackNavigator } from '@react-navigation/native-stack';

import {
    DeviceNameStackParamList,
    DeviceNameStackRoutes,
    stackNavigationOptionsConfig,
} from '@suite-native/navigation';

import { useDeviceConnectionGuard } from '../hooks/useDeviceConnectionGuard';
import { ContinueOnTrezorScreen } from '../screens/ContinueOnTrezorScreen';
import { DeviceNameLoadingScreen } from '../screens/DeviceNameLoadingScreen';
import { DeviceNameScreen } from '../screens/DeviceNameScreen';

const DeviceNameStack = createNativeStackNavigator<DeviceNameStackParamList>();

export const DeviceNameStackNavigator = () => {
    const { isDeviceConnected } = useDeviceConnectionGuard();

    if (!isDeviceConnected) return null;

    return (
        <DeviceNameStack.Navigator
            initialRouteName={DeviceNameStackRoutes.DeviceName}
            screenOptions={stackNavigationOptionsConfig}
        >
            <DeviceNameStack.Screen
                name={DeviceNameStackRoutes.DeviceName}
                component={DeviceNameScreen}
            />
            <DeviceNameStack.Screen
                name={DeviceNameStackRoutes.ContinueOnTrezor}
                component={ContinueOnTrezorScreen}
            />
            <DeviceNameStack.Screen
                name={DeviceNameStackRoutes.DeviceNameLoadingScreen}
                component={DeviceNameLoadingScreen}
            />
        </DeviceNameStack.Navigator>
    );
};

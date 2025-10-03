import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { useDeviceConnectionGuard } from '@suite-native/device-authorization';
import {
    DeviceNameStackParamList,
    DeviceNameStackRoutes,
    stackNavigationOptionsConfig,
} from '@suite-native/navigation';

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

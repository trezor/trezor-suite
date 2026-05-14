import { createNativeStackNavigator } from '@react-navigation/native-stack';

import {
    DeviceConnectionGuardScreen,
    useDeviceConnectionGuard,
} from '@suite-native/device-authorization';
import {
    type DeviceNameStackParamList,
    DeviceNameStackRoutes,
    stackNavigationOptionsConfig,
} from '@suite-native/navigation';

import { ContinueOnTrezorScreen } from '../screens/ContinueOnTrezorScreen';
import { DeviceNameLoadingScreen } from '../screens/DeviceNameLoadingScreen';
import { DeviceNameScreen } from '../screens/DeviceNameScreen';

const DeviceNameStack = createNativeStackNavigator<DeviceNameStackParamList>();

export const DeviceNameStackNavigator = () => {
    const { isDeviceConnectionGuardVisible } = useDeviceConnectionGuard();

    return (
        <DeviceNameStack.Navigator screenOptions={stackNavigationOptionsConfig}>
            {isDeviceConnectionGuardVisible && (
                <DeviceNameStack.Screen
                    name={DeviceNameStackRoutes.DeviceConnectionGuard}
                    component={DeviceConnectionGuardScreen}
                />
            )}
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

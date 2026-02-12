import { useSelector } from 'react-redux';

import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { selectIsDeviceConnected } from '@suite-common/device';
import { DeviceConnectionGuardScreen } from '@suite-native/device-authorization';
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
    const isDeviceConnected = useSelector(selectIsDeviceConnected);

    return (
        <DeviceNameStack.Navigator screenOptions={stackNavigationOptionsConfig}>
            {!isDeviceConnected && (
                <DeviceNameStack.Screen
                    name={DeviceNameStackRoutes.DeviceConnectionGuard}
                    component={DeviceConnectionGuardScreen}
                />
            )}
            {isDeviceConnected && (
                <DeviceNameStack.Screen
                    name={DeviceNameStackRoutes.DeviceName}
                    component={DeviceNameScreen}
                />
            )}
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

import { createNativeStackNavigator } from '@react-navigation/native-stack';

import {
    DeviceStackParamList,
    DeviceStackRoutes,
    stackNavigationOptionsConfig,
} from '@suite-native/navigation';

import { DeviceInfoModalScreen } from '../screens/DeviceInfoModalScreen';
import { DevicePinProtectionStackNavigator } from './DevicePinProtectionStackNavigator';

export const DeviceSettings = createNativeStackNavigator<DeviceStackParamList>();

export const DeviceStackNavigator = () => (
    <DeviceSettings.Navigator
        initialRouteName={DeviceStackRoutes.DeviceSettings}
        screenOptions={stackNavigationOptionsConfig}
    >
        <DeviceSettings.Screen
            name={DeviceStackRoutes.DeviceSettings}
            component={DeviceInfoModalScreen}
        />
        <DeviceSettings.Screen
            name={DeviceStackRoutes.DevicePinProtection}
            component={DevicePinProtectionStackNavigator}
        />
    </DeviceSettings.Navigator>
);

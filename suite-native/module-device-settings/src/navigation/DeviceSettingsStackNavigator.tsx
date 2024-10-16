import { createNativeStackNavigator } from '@react-navigation/native-stack';

import {
    DeviceSettingsStackParamList,
    DeviceStackRoutes,
    stackNavigationOptionsConfig,
} from '@suite-native/navigation';

import { DeviceSettingsModalScreen } from '../screens/DeviceSettingsModalScreen';
import { DevicePinProtectionStackNavigator } from './DevicePinProtectionStackNavigator';

export const DeviceSettings = createNativeStackNavigator<DeviceSettingsStackParamList>();

export const DeviceSettingsStackNavigator = () => (
    <DeviceSettings.Navigator
        initialRouteName={DeviceStackRoutes.DeviceSettings}
        screenOptions={stackNavigationOptionsConfig}
    >
        <DeviceSettings.Screen
            name={DeviceStackRoutes.DeviceSettings}
            component={DeviceSettingsModalScreen}
        />
        <DeviceSettings.Screen
            name={DeviceStackRoutes.DevicePinProtection}
            component={DevicePinProtectionStackNavigator}
        />
    </DeviceSettings.Navigator>
);

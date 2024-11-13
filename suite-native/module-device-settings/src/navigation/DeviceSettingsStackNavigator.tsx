import { createNativeStackNavigator } from '@react-navigation/native-stack';

import {
    DeviceSettingsStackParamList,
    DeviceStackRoutes,
    stackNavigationOptionsConfig,
} from '@suite-native/navigation';

import { DeviceSettingsModalScreen } from '../screens/DeviceSettingsModalScreen';
import { DeviceAuthenticityStackNavigator } from './DeviceAuthenticityStackNavigator';
import { DevicePinProtectionStackNavigator } from './DevicePinProtectionStackNavigator';

const DeviceSettingsStack = createNativeStackNavigator<DeviceSettingsStackParamList>();

export const DeviceSettingsStackNavigator = () => (
    <DeviceSettingsStack.Navigator
        initialRouteName={DeviceStackRoutes.DeviceSettings}
        screenOptions={stackNavigationOptionsConfig}
    >
        <DeviceSettingsStack.Screen
            name={DeviceStackRoutes.DeviceSettings}
            component={DeviceSettingsModalScreen}
        />
        <DeviceSettingsStack.Screen
            name={DeviceStackRoutes.DevicePinProtection}
            component={DevicePinProtectionStackNavigator}
        />
        <DeviceSettingsStack.Screen
            name={DeviceStackRoutes.DeviceAuthenticity}
            component={DeviceAuthenticityStackNavigator}
        />
    </DeviceSettingsStack.Navigator>
);

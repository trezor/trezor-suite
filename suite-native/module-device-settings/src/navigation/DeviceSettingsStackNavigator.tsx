import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { FirmwareUpdateInProgressScreen } from '@suite-native/firmware';
import {
    DeviceSettingsStackParamList,
    DeviceStackRoutes,
    stackNavigationOptionsConfig,
} from '@suite-native/navigation';

import { DeviceAuthenticityStackNavigator } from './DeviceAuthenticityStackNavigator';
import { DevicePinProtectionStackNavigator } from './DevicePinProtectionStackNavigator';
import { ContinueOnTrezorScreen } from '../screens/ContinueOnTrezorScreen';
import { DeviceSettingsModalScreen } from '../screens/DeviceSettingsModalScreen';
import { FirmwareUpdateScreen } from '../screens/FirmwareUpdateScreen/FirmwareUpdateScreen';
const DeviceSettingsStack = createNativeStackNavigator<DeviceSettingsStackParamList>();

export const DeviceSettingsStackNavigator = () => (
    <DeviceSettingsStack.Navigator
        initialRouteName={DeviceStackRoutes.DeviceSettings}
        screenOptions={{ ...stackNavigationOptionsConfig, animation: 'slide_from_bottom' }}
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
        <DeviceSettingsStack.Screen
            name={DeviceStackRoutes.FirmwareUpdate}
            component={FirmwareUpdateScreen}
        />
        <DeviceSettingsStack.Screen
            name={DeviceStackRoutes.ContinueOnTrezor}
            component={ContinueOnTrezorScreen}
        />
        <DeviceSettingsStack.Screen
            name={DeviceStackRoutes.FirmwareUpdateInProgress}
            component={FirmwareUpdateInProgressScreen}
        />
    </DeviceSettingsStack.Navigator>
);

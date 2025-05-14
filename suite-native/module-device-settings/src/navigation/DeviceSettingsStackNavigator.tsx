import { createNativeStackNavigator } from '@react-navigation/native-stack';

import {
    DeviceSettingsStackParamList,
    DeviceStackRoutes,
    stackNavigationOptionsConfig,
} from '@suite-native/navigation';

import { DeviceAuthenticityStackNavigator } from './DeviceAuthenticityStackNavigator';
import { DevicePinProtectionStackNavigator } from './DevicePinProtectionStackNavigator';
import { WipeDeviceStackNavigator } from './WipeDeviceStackNavigator';
import { ConfirmFirmwareUpdateScreen } from '../screens/ConfirmFirmwareUpdateScreen';
import { ContinueOnTrezorScreen } from '../screens/ContinueOnTrezorScreen';
import { DeviceSettingsModalScreen } from '../screens/DeviceSettingsModalScreen';
import { FirmwareInstallationScreen } from '../screens/FirmwareInstallationScreen';
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
            name={DeviceStackRoutes.WipeDevice}
            component={WipeDeviceStackNavigator}
        />
        <DeviceSettingsStack.Screen
            name={DeviceStackRoutes.ConfirmFirmwareUpdate}
            component={ConfirmFirmwareUpdateScreen}
        />
        <DeviceSettingsStack.Screen
            name={DeviceStackRoutes.ContinueOnTrezor}
            component={ContinueOnTrezorScreen}
        />
        <DeviceSettingsStack.Screen
            name={DeviceStackRoutes.FirmwareInstallation}
            component={FirmwareInstallationScreen}
        />
    </DeviceSettingsStack.Navigator>
);

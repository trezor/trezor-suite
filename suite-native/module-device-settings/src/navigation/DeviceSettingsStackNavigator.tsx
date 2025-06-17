import { createNativeStackNavigator } from '@react-navigation/native-stack';

import {
    DeviceSettingsStackParamList,
    DeviceSettingsStackRoutes,
    stackNavigationOptionsConfig,
} from '@suite-native/navigation';

import { DeviceAuthenticityStackNavigator } from './DeviceAuthenticityStackNavigator';
import { DeviceNameStackNavigator } from './DeviceNameStackNavigator';
import { DevicePinProtectionStackNavigator } from './DevicePinProtectionStackNavigator';
import { WipeDeviceStackNavigator } from './WipeDeviceStackNavigator';
import { ConfirmFirmwareUpdateScreen } from '../screens/ConfirmFirmwareUpdateScreen';
import { ContinueOnTrezorScreen } from '../screens/ContinueOnTrezorScreen';
import { DeviceAuthenticityScreen } from '../screens/DeviceAuthenticityScreen';
import { DeviceSettingsModalScreen } from '../screens/DeviceSettingsModalScreen';
import { FirmwareInstallationScreen } from '../screens/FirmwareInstallationScreen';
import { PinProtectionScreen } from '../screens/PinProtectionScreen';

const DeviceSettingsStack = createNativeStackNavigator<DeviceSettingsStackParamList>();

export const DeviceSettingsStackNavigator = () => (
    <DeviceSettingsStack.Navigator
        initialRouteName={DeviceSettingsStackRoutes.DeviceSettings}
        screenOptions={{ ...stackNavigationOptionsConfig, animation: 'slide_from_bottom' }}
    >
        <DeviceSettingsStack.Screen
            name={DeviceSettingsStackRoutes.DeviceSettings}
            component={DeviceSettingsModalScreen}
        />
        <DeviceSettingsStack.Screen
            name={DeviceSettingsStackRoutes.DevicePinProtectionStack}
            component={DevicePinProtectionStackNavigator}
        />
        <DeviceSettingsStack.Screen
            name={DeviceSettingsStackRoutes.PinProtection}
            component={PinProtectionScreen}
        />
        <DeviceSettingsStack.Screen
            name={DeviceSettingsStackRoutes.DeviceAuthenticity}
            component={DeviceAuthenticityScreen}
        />
        <DeviceSettingsStack.Screen
            name={DeviceSettingsStackRoutes.DeviceAuthenticityStack}
            component={DeviceAuthenticityStackNavigator}
        />
        <DeviceSettingsStack.Screen
            name={DeviceSettingsStackRoutes.WipeDeviceStack}
            component={WipeDeviceStackNavigator}
        />
        <DeviceSettingsStack.Screen
            name={DeviceSettingsStackRoutes.ConfirmFirmwareUpdate}
            component={ConfirmFirmwareUpdateScreen}
        />
        <DeviceSettingsStack.Screen
            name={DeviceSettingsStackRoutes.ContinueOnTrezor}
            component={ContinueOnTrezorScreen}
        />
        <DeviceSettingsStack.Screen
            name={DeviceSettingsStackRoutes.FirmwareInstallation}
            component={FirmwareInstallationScreen}
        />
        <DeviceSettingsStack.Screen
            name={DeviceSettingsStackRoutes.DeviceNameStack}
            component={DeviceNameStackNavigator}
        />
    </DeviceSettingsStack.Navigator>
);

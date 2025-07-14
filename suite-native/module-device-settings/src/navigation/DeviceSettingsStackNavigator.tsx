import { createNativeStackNavigator } from '@react-navigation/native-stack';

// this import is against the rule of not importing from other modules. This specific case is OK, because the @suite-native/module-check-backup
// is imported only here and nowhere else, so it is treated as a submodule of @suite-native/module-device-settings.
import { DeviceCheckBackupStackNavigator } from '@suite-native/module-check-backup';
import {
    DeviceSettingsStackParamList,
    DeviceSettingsStackRoutes,
    stackNavigationOptionsConfig,
} from '@suite-native/navigation';

import { DeviceAuthenticityStackNavigator } from './DeviceAuthenticityStackNavigator';
import { DeviceNameStackNavigator } from './DeviceNameStackNavigator';
import { DevicePinProtectionStackNavigator } from './DevicePinProtectionStackNavigator';
import { FirmwareUpdateStackNavigator } from './FirmwareUpdateStackNavigator';
import { WipeDeviceStackNavigator } from './WipeDeviceStackNavigator';
import { ContinueOnTrezorScreen } from '../screens/ContinueOnTrezorScreen';
import { DeviceAuthenticityScreen } from '../screens/DeviceAuthenticityScreen';
import { DeviceSettingsModalScreen } from '../screens/DeviceSettingsModalScreen';
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
            name={DeviceSettingsStackRoutes.FirmwareUpdateStack}
            component={FirmwareUpdateStackNavigator}
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
            name={DeviceSettingsStackRoutes.ContinueOnTrezor}
            component={ContinueOnTrezorScreen}
        />
        <DeviceSettingsStack.Screen
            name={DeviceSettingsStackRoutes.DeviceNameStack}
            component={DeviceNameStackNavigator}
        />
        <DeviceSettingsStack.Screen
            name={DeviceSettingsStackRoutes.DeviceCheckBackupStack}
            component={DeviceCheckBackupStackNavigator}
        />
    </DeviceSettingsStack.Navigator>
);

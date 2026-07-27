import { createNativeStackNavigator } from '@react-navigation/native-stack';

// this import is against the rule of not importing from other modules. This specific case is OK, because the @suite-native/module-check-backup
// is imported only here and nowhere else, so it is treated as a submodule of @suite-native/module-device-settings.
import { DeviceCheckBackupStackNavigator } from '@suite-native/module-check-backup';
import {
    type DeviceSettingsStackParamList,
    DeviceSettingsStackRoutes,
    stackNavigationOptionsConfig,
} from '@suite-native/navigation';

import { DeviceAuthenticityStackNavigator } from './DeviceAuthenticityStackNavigator';
import { DeviceAutoConnectStackNavigator } from './DeviceAutoConnectStackNavigator';
import { DeviceNameStackNavigator } from './DeviceNameStackNavigator';
import { DevicePassphraseStackNavigator } from './DevicePassphraseStackNavigator';
import { DevicePinProtectionStackNavigator } from './DevicePinProtectionStackNavigator';
import { FirmwareLanguageStackNavigator } from './FirmwareLanguageStackNavigator';
import { FirmwareUpdateStackNavigator } from './FirmwareUpdateStackNavigator';
import { ForgetDeviceStackNavigator } from './ForgetDeviceStackNavigator';
import { WipeDeviceStackNavigator } from './WipeDeviceStackNavigator';
import { BackupAndPassphraseScreen } from '../screens/BackupAndPassphraseScreen';
import { DeviceAuthenticityScreen } from '../screens/DeviceAuthenticityScreen';
import { DeviceConnectionScreen } from '../screens/DeviceConnectionScreen';
import { DeviceFirmwareScreen } from '../screens/DeviceFirmwareScreen';
import { DeviceSettingsScreen } from '../screens/DeviceSettingsScreen';
import { ForgetDeviceScreen } from '../screens/ForgetDeviceScreen';
import { PinProtectionScreen } from '../screens/PinProtectionScreen';
import { WipeDeviceScreen } from '../screens/WipeDeviceScreen';

const DeviceSettingsStack = createNativeStackNavigator<DeviceSettingsStackParamList>();

export const DeviceSettingsStackNavigator = () => (
    <DeviceSettingsStack.Navigator
        initialRouteName={DeviceSettingsStackRoutes.DeviceSettings}
        screenOptions={stackNavigationOptionsConfig}
    >
        <DeviceSettingsStack.Screen
            name={DeviceSettingsStackRoutes.DeviceSettings}
            component={DeviceSettingsScreen}
        />
        <DeviceSettingsStack.Screen
            name={DeviceSettingsStackRoutes.DeviceFirmware}
            component={DeviceFirmwareScreen}
        />
        <DeviceSettingsStack.Screen
            name={DeviceSettingsStackRoutes.DeviceConnection}
            component={DeviceConnectionScreen}
        />
        <DeviceSettingsStack.Screen
            name={DeviceSettingsStackRoutes.ForgetDevice}
            component={ForgetDeviceScreen}
        />
        <DeviceSettingsStack.Screen
            name={DeviceSettingsStackRoutes.DevicePinProtection}
            component={PinProtectionScreen}
        />
        <DeviceSettingsStack.Screen
            name={DeviceSettingsStackRoutes.DeviceBackupAndPassphrase}
            component={BackupAndPassphraseScreen}
        />
        <DeviceSettingsStack.Screen
            name={DeviceSettingsStackRoutes.DeviceAuthenticity}
            component={DeviceAuthenticityScreen}
        />
        <DeviceSettingsStack.Screen
            name={DeviceSettingsStackRoutes.WipeDevice}
            component={WipeDeviceScreen}
        />
        <DeviceSettingsStack.Group screenOptions={{ animation: 'slide_from_bottom' }}>
            <DeviceSettingsStack.Screen
                name={DeviceSettingsStackRoutes.DeviceNameStack}
                component={DeviceNameStackNavigator}
            />
            <DeviceSettingsStack.Screen
                name={DeviceSettingsStackRoutes.FirmwareUpdateStack}
                component={FirmwareUpdateStackNavigator}
            />
            <DeviceSettingsStack.Screen
                name={DeviceSettingsStackRoutes.FirmwareLanguageStack}
                component={FirmwareLanguageStackNavigator}
            />
            <DeviceSettingsStack.Screen
                name={DeviceSettingsStackRoutes.DeviceAutoConnectStack}
                component={DeviceAutoConnectStackNavigator}
            />
            <DeviceSettingsStack.Screen
                name={DeviceSettingsStackRoutes.ForgetDeviceStack}
                component={ForgetDeviceStackNavigator}
            />
            <DeviceSettingsStack.Screen
                name={DeviceSettingsStackRoutes.DevicePinProtectionStack}
                component={DevicePinProtectionStackNavigator}
            />
            <DeviceSettingsStack.Screen
                name={DeviceSettingsStackRoutes.DeviceCheckBackupStack}
                component={DeviceCheckBackupStackNavigator}
            />
            <DeviceSettingsStack.Screen
                name={DeviceSettingsStackRoutes.DevicePassphraseStack}
                component={DevicePassphraseStackNavigator}
            />
            <DeviceSettingsStack.Screen
                name={DeviceSettingsStackRoutes.DeviceAuthenticityStack}
                component={DeviceAuthenticityStackNavigator}
            />
            <DeviceSettingsStack.Screen
                name={DeviceSettingsStackRoutes.WipeDeviceStack}
                component={WipeDeviceStackNavigator}
            />
        </DeviceSettingsStack.Group>
    </DeviceSettingsStack.Navigator>
);

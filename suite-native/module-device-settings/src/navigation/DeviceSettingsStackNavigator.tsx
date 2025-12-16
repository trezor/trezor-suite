import { useSelector } from 'react-redux';

import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { selectIsDeviceConnected } from '@suite-common/wallet-core';
// this import is against the rule of not importing from other modules. This specific case is OK, because the @suite-native/module-check-backup
// is imported only here and nowhere else, so it is treated as a submodule of @suite-native/module-device-settings.
import { DeviceCheckBackupStackNavigator } from '@suite-native/module-check-backup';
import {
    DeviceSettingsStackParamList,
    DeviceSettingsStackRoutes,
    stackNavigationOptionsConfig,
} from '@suite-native/navigation';

import { BackupAndPassphraseStackNavigator } from './BackupAndPassphraseStackNavigator';
import { DeviceAuthenticityStackNavigator } from './DeviceAuthenticityStackNavigator';
import { DeviceAutoConnectStackNavigator } from './DeviceAutoConnectStackNavigator';
import { DeviceNameStackNavigator } from './DeviceNameStackNavigator';
import { DevicePinProtectionStackNavigator } from './DevicePinProtectionStackNavigator';
import { FirmwareLanguageStackNavigator } from './FirmwareLanguageStackNavigator';
import { FirmwareUpdateStackNavigator } from './FirmwareUpdateStackNavigator';
import { WipeDeviceStackNavigator } from './WipeDeviceStackNavigator';
import { ContinueOnTrezorScreen } from '../screens/ContinueOnTrezorScreen';
import { DeviceAuthenticityScreen } from '../screens/DeviceAuthenticityScreen';
import { DeviceAutoConnectScreen } from '../screens/DeviceAutoConnectScreen';
import { DeviceConnectionGuardScreenWithCancel } from '../screens/DeviceConnectionGuardScreen';
import { DeviceFirmwareScreen } from '../screens/DeviceFirmwareScreen';
import { DeviceSettingsModalScreen } from '../screens/DeviceSettingsModalScreen';
import { PinProtectionScreen } from '../screens/PinProtectionScreen';
import { UnpairBluetoothDeviceScreen } from '../screens/UnpairBluetoothDeviceScreen';

const DeviceSettingsStack = createNativeStackNavigator<DeviceSettingsStackParamList>();

export const DeviceSettingsStackNavigator = () => {
    const isDeviceConnected = useSelector(selectIsDeviceConnected);

    return (
        <DeviceSettingsStack.Navigator
            initialRouteName={DeviceSettingsStackRoutes.DeviceSettings}
            screenOptions={stackNavigationOptionsConfig}
        >
            <DeviceSettingsStack.Screen
                name={DeviceSettingsStackRoutes.DeviceSettings}
                component={DeviceSettingsModalScreen}
            />
            <DeviceSettingsStack.Screen
                name={DeviceSettingsStackRoutes.DeviceFirmware}
                component={DeviceFirmwareScreen}
            />
            <DeviceSettingsStack.Screen
                name={DeviceSettingsStackRoutes.DeviceAutoConnect}
                component={DeviceAutoConnectScreen}
            />
            <DeviceSettingsStack.Screen
                name={DeviceSettingsStackRoutes.UnpairBluetoothDevice}
                component={UnpairBluetoothDeviceScreen}
            />
            <DeviceSettingsStack.Screen
                name={DeviceSettingsStackRoutes.DevicePinProtection}
                component={PinProtectionScreen}
            />
            <DeviceSettingsStack.Group screenOptions={{ animation: 'slide_from_bottom' }}>
                <DeviceSettingsStack.Screen
                    name={DeviceSettingsStackRoutes.FirmwareUpdateStack}
                    component={FirmwareUpdateStackNavigator}
                />
                <DeviceSettingsStack.Screen
                    name={DeviceSettingsStackRoutes.FirmwareLanguageStack}
                    component={FirmwareLanguageStackNavigator}
                />
                <DeviceSettingsStack.Screen
                    name={DeviceSettingsStackRoutes.ContinueOnTrezor}
                    component={ContinueOnTrezorScreen}
                />
                <DeviceSettingsStack.Screen
                    name={DeviceSettingsStackRoutes.DeviceAutoConnectStack}
                    component={DeviceAutoConnectStackNavigator}
                />
                {!isDeviceConnected && (
                    <DeviceSettingsStack.Screen
                        name={DeviceSettingsStackRoutes.DeviceAutoConnectGuard}
                        component={DeviceConnectionGuardScreenWithCancel}
                    />
                )}
                <DeviceSettingsStack.Screen
                    name={DeviceSettingsStackRoutes.DevicePinProtectionStack}
                    component={DevicePinProtectionStackNavigator}
                />
            </DeviceSettingsStack.Group>
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
                name={DeviceSettingsStackRoutes.DeviceNameStack}
                component={DeviceNameStackNavigator}
            />
            <DeviceSettingsStack.Screen
                name={DeviceSettingsStackRoutes.BackupAndPassphraseStack}
                component={BackupAndPassphraseStackNavigator}
            />
            <DeviceSettingsStack.Screen
                name={DeviceSettingsStackRoutes.DeviceCheckBackupStack}
                component={DeviceCheckBackupStackNavigator}
            />
        </DeviceSettingsStack.Navigator>
    );
};

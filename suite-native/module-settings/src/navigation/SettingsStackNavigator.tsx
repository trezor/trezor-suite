import { createNativeStackNavigator } from '@react-navigation/native-stack';

import {
    SettingsStackParamList,
    SettingsStackRoutes,
    stackNavigationOptionsConfig,
} from '@suite-native/navigation';

import { SettingsCoinEnablingScreen } from '../screens/SettingsCoinEnablingScreen';
import { SettingsDeviceChecksScreen } from '../screens/SettingsDeviceChecksScreen';
import { SettingsPreferencesScreen } from '../screens/SettingsPreferencesScreen';
import { SettingsPrivacyScreen } from '../screens/SettingsPrivacyScreen';
import { SettingsSupportScreen } from '../screens/SettingsSupportScreen';
import { SettingsViewOnlyScreen } from '../screens/SettingsViewOnlyScreen';
import { TurnOffDeviceAuthenticityCheckScreen } from '../screens/TurnOffDeviceAuthenticityCheckScreen';
import { TurnOffFirmwareAuthenticityCheckScreen } from '../screens/TurnOffFirmwareAuthenticityCheckScreen';

const SettingsStack = createNativeStackNavigator<SettingsStackParamList>();

export const SettingsStackNavigator = () => (
    <SettingsStack.Navigator screenOptions={stackNavigationOptionsConfig}>
        <SettingsStack.Screen
            options={{ title: SettingsStackRoutes.SettingsPreferences }}
            name={SettingsStackRoutes.SettingsPreferences}
            component={SettingsPreferencesScreen}
        />

        <SettingsStack.Screen
            options={{ title: SettingsStackRoutes.SettingsPrivacy }}
            name={SettingsStackRoutes.SettingsPrivacy}
            component={SettingsPrivacyScreen}
        />
        <SettingsStack.Screen
            options={{ title: SettingsStackRoutes.SettingsViewOnly }}
            name={SettingsStackRoutes.SettingsViewOnly}
            component={SettingsViewOnlyScreen}
        />
        <SettingsStack.Screen
            options={{ title: SettingsStackRoutes.SettingsSupport }}
            name={SettingsStackRoutes.SettingsSupport}
            component={SettingsSupportScreen}
        />

        <SettingsStack.Screen
            options={{ title: SettingsStackRoutes.SettingsCoinEnabling }}
            name={SettingsStackRoutes.SettingsCoinEnabling}
            component={SettingsCoinEnablingScreen}
        />
        <SettingsStack.Screen
            name={SettingsStackRoutes.SettingsDeviceChecks}
            component={SettingsDeviceChecksScreen}
        />
        <SettingsStack.Screen
            name={SettingsStackRoutes.TurnOffFirmwareAuthenticityCheck}
            component={TurnOffFirmwareAuthenticityCheckScreen}
        />
        <SettingsStack.Screen
            name={SettingsStackRoutes.TurnOffDeviceAuthenticityCheck}
            component={TurnOffDeviceAuthenticityCheckScreen}
        />
    </SettingsStack.Navigator>
);

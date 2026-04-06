import { createNativeStackNavigator } from '@react-navigation/native-stack';

import {
    type SettingsStackParamList,
    SettingsStackRoutes,
    stackNavigationOptionsConfig,
} from '@suite-native/navigation';
import { SettingsTradingLocationScreen } from '@suite-native/trading-residence';

import { BitcoinBackendsScreen } from '../screens/BitcoinBackendsScreen';
import { SettingsAdvancedScreen } from '../screens/SettingsAdvancedScreen';
import { SettingsAppLogScreen } from '../screens/SettingsAppLogScreen';
import { SettingsAutoEjectScreen } from '../screens/SettingsAutoEjectScreen';
import { SettingsCoinEnablingScreen } from '../screens/SettingsCoinEnablingScreen';
import { SettingsDustPhishingScreen } from '../screens/SettingsDustPhishingScreen';
import { SettingsExperimentalScreen } from '../screens/SettingsExperimentalScreen';
import { SettingsPreferencesScreen } from '../screens/SettingsPreferencesScreen';
import { SettingsPrivacyScreen } from '../screens/SettingsPrivacyScreen';
import { SettingsSuiteSyncScreen } from '../screens/SettingsSuiteSyncScreen';
import { SettingsSupportScreen } from '../screens/SettingsSupportScreen';
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
            component={SettingsAutoEjectScreen}
        />
        <SettingsStack.Screen
            options={{ title: SettingsStackRoutes.SettingsSupport }}
            name={SettingsStackRoutes.SettingsSupport}
            component={SettingsSupportScreen}
        />
        <SettingsStack.Screen
            options={{ title: SettingsStackRoutes.SettingsAppLog }}
            name={SettingsStackRoutes.SettingsAppLog}
            component={SettingsAppLogScreen}
        />
        <SettingsStack.Screen
            options={{ title: SettingsStackRoutes.SettingsCoinEnabling }}
            name={SettingsStackRoutes.SettingsCoinEnabling}
            component={SettingsCoinEnablingScreen}
        />
        <SettingsStack.Screen
            options={{ title: SettingsStackRoutes.SettingsSuiteSync }}
            name={SettingsStackRoutes.SettingsSuiteSync}
            component={SettingsSuiteSyncScreen}
        />
        <SettingsStack.Screen
            name={SettingsStackRoutes.SettingsAdvanced}
            component={SettingsAdvancedScreen}
        />
        <SettingsStack.Screen
            name={SettingsStackRoutes.SettingsDustPhishing}
            component={SettingsDustPhishingScreen}
        />
        <SettingsStack.Screen
            name={SettingsStackRoutes.SettingsExperimental}
            component={SettingsExperimentalScreen}
        />
        <SettingsStack.Screen
            name={SettingsStackRoutes.TurnOffFirmwareAuthenticityCheck}
            component={TurnOffFirmwareAuthenticityCheckScreen}
        />
        <SettingsStack.Screen
            name={SettingsStackRoutes.TurnOffDeviceAuthenticityCheck}
            component={TurnOffDeviceAuthenticityCheckScreen}
        />
        <SettingsStack.Screen
            name={SettingsStackRoutes.BitcoinBackends}
            component={BitcoinBackendsScreen}
        />
        <SettingsStack.Screen
            options={{ title: SettingsStackRoutes.SettingsTradingLocation }}
            name={SettingsStackRoutes.SettingsTradingLocation}
            component={SettingsTradingLocationScreen}
        />
    </SettingsStack.Navigator>
);

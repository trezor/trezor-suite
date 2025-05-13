import { createNativeStackNavigator } from '@react-navigation/native-stack';

import {
    SettingsStackParamList,
    SettingsStackRoutes,
    stackNavigationOptionsConfig,
} from '@suite-native/navigation';

import { SettingsAboutUsScreen } from '../screens/SettingsAboutUsScreen';
import { SettingsCoinEnablingScreen } from '../screens/SettingsCoinEnablingScreen';
import { SettingsCustomizationScreen } from '../screens/SettingsCustomizationScreen';
import { SettingsDeviceChecksScreen } from '../screens/SettingsDeviceChecksScreen';
import { SettingsFAQScreen } from '../screens/SettingsFAQScreen';
import { SettingsLocalizationScreen } from '../screens/SettingsLocalizationScreen';
import { SettingsPrivacyAndSecurityScreen } from '../screens/SettingsPrivacyAndSecurityScreen';
import { SettingsViewOnlyScreen } from '../screens/SettingsViewOnlyScreen';
import { TurnOffDeviceAuthenticityCheckScreen } from '../screens/TurnOffDeviceAuthenticityCheckScreen';
import { TurnOffFirmwareAuthenticityCheckScreen } from '../screens/TurnOffFirmwareAuthenticityCheckScreen';

const SettingsStack = createNativeStackNavigator<SettingsStackParamList>();

export const SettingsStackNavigator = () => (
    <SettingsStack.Navigator screenOptions={stackNavigationOptionsConfig}>
        <SettingsStack.Screen
            options={{ title: SettingsStackRoutes.SettingsLocalization }}
            name={SettingsStackRoutes.SettingsLocalization}
            component={SettingsLocalizationScreen}
        />
        <SettingsStack.Screen
            options={{ title: SettingsStackRoutes.SettingsCustomization }}
            name={SettingsStackRoutes.SettingsCustomization}
            component={SettingsCustomizationScreen}
        />
        <SettingsStack.Screen
            options={{ title: SettingsStackRoutes.SettingsPrivacyAndSecurity }}
            name={SettingsStackRoutes.SettingsPrivacyAndSecurity}
            component={SettingsPrivacyAndSecurityScreen}
        />
        <SettingsStack.Screen
            options={{ title: SettingsStackRoutes.SettingsViewOnly }}
            name={SettingsStackRoutes.SettingsViewOnly}
            component={SettingsViewOnlyScreen}
        />
        <SettingsStack.Screen
            options={{ title: SettingsStackRoutes.SettingsFAQ }}
            name={SettingsStackRoutes.SettingsFAQ}
            component={SettingsFAQScreen}
        />
        <SettingsStack.Screen
            options={{ title: SettingsStackRoutes.SettingsAbout }}
            name={SettingsStackRoutes.SettingsAbout}
            component={SettingsAboutUsScreen}
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

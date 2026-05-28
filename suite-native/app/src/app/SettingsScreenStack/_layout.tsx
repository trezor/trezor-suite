/* eslint-disable import/no-default-export */
import { Stack } from 'expo-router';

import { SettingsStackRoutes, stackNavigationOptionsConfig } from '@suite-native/navigation';

const SettingsScreenStackLayout = () => (
    <Stack screenOptions={stackNavigationOptionsConfig}>
        <Stack.Screen
            options={{ title: SettingsStackRoutes.SettingsPreferences }}
            name={SettingsStackRoutes.SettingsPreferences}
        />
        <Stack.Screen
            options={{ title: SettingsStackRoutes.SettingsPrivacy }}
            name={SettingsStackRoutes.SettingsPrivacy}
        />
        <Stack.Screen
            options={{ title: SettingsStackRoutes.SettingsViewOnly }}
            name={SettingsStackRoutes.SettingsViewOnly}
        />
        <Stack.Screen
            options={{ title: SettingsStackRoutes.SettingsSupport }}
            name={SettingsStackRoutes.SettingsSupport}
        />
        <Stack.Screen
            options={{ title: SettingsStackRoutes.SettingsAppLog }}
            name={SettingsStackRoutes.SettingsAppLog}
        />
        <Stack.Screen
            options={{ title: SettingsStackRoutes.SettingsNetworks }}
            name={SettingsStackRoutes.SettingsNetworks}
        />
        <Stack.Screen
            options={{ title: SettingsStackRoutes.SettingsSuiteSync }}
            name={SettingsStackRoutes.SettingsSuiteSync}
        />
        <Stack.Screen name={SettingsStackRoutes.SettingsAdvanced} />
        <Stack.Screen name={SettingsStackRoutes.SettingsDustPhishing} />
        <Stack.Screen name={SettingsStackRoutes.SettingsExperimental} />
        <Stack.Screen name={SettingsStackRoutes.TurnOffFirmwareAuthenticityCheck} />
        <Stack.Screen name={SettingsStackRoutes.TurnOffDeviceAuthenticityCheck} />
        <Stack.Screen name={SettingsStackRoutes.BitcoinBackends} />
        <Stack.Screen
            options={{ title: SettingsStackRoutes.SettingsTradingLocation }}
            name={SettingsStackRoutes.SettingsTradingLocation}
        />
    </Stack>
);

export default SettingsScreenStackLayout;

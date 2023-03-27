import React from 'react';

import { createNativeStackNavigator } from '@react-navigation/native-stack';

import {
    SettingsStackParamList,
    SettingsStackRoutes,
    stackNavigationOptionsConfig,
} from '@suite-native/navigation';

import { SettingsScreen } from '../screens/SettingsScreen';
import { SettingsLocalisationScreen } from '../screens/SettingsLocalisationScreen';
import { SettingsCustomizationScreen } from '../screens/SettingsCustomizationScreen';
import { SettingsPrivacyAndSecurity } from '../screens/SettingsPrivacyAndSecurity';
import { SettingsAboutUsScreen } from '../screens/SettingsAboutUsScreen';
import { SettingsFAQScreen } from '../screens/SettingsFAQScreen';

export const SettingsStack = createNativeStackNavigator<SettingsStackParamList>();

export const SettingsStackNavigator = () => (
    <SettingsStack.Navigator
        initialRouteName={SettingsStackRoutes.Settings}
        screenOptions={stackNavigationOptionsConfig}
    >
        <SettingsStack.Screen
            options={{ title: SettingsStackRoutes.Settings }}
            name={SettingsStackRoutes.Settings}
            component={SettingsScreen}
        />
        <SettingsStack.Screen
            options={{ title: SettingsStackRoutes.SettingsLocalisation }}
            name={SettingsStackRoutes.SettingsLocalisation}
            component={SettingsLocalisationScreen}
        />
        <SettingsStack.Screen
            options={{ title: SettingsStackRoutes.SettingsCustomization }}
            name={SettingsStackRoutes.SettingsCustomization}
            component={SettingsCustomizationScreen}
        />
        <SettingsStack.Screen
            options={{ title: SettingsStackRoutes.SettingsPrivacyAndSecurity }}
            name={SettingsStackRoutes.SettingsPrivacyAndSecurity}
            component={SettingsPrivacyAndSecurity}
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
    </SettingsStack.Navigator>
);

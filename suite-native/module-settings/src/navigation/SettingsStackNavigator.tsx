import React from 'react';

import { createStackNavigator } from '@react-navigation/stack';

import { stackNavigationOptionsConfig } from '@suite-native/navigation';

import { SettingsStackRoutes, SettingsStackParamList } from './routes';
import { SettingsScreen } from '../screens/SettingsScreen';
import { SettingsLocalisationScreen } from '../screens/SettingsLocalisationScreen';
import { SettingsLabelingScreen } from '../screens/SettingsLabelingScreen';
import { SettingsAdvancedScreen } from '../screens/SettingsAdvancedScreen';
import { SettingsCustomizationScreen } from '../screens/SettingsCustomizationScreen';
import { SettingsSecurityScreen } from '../screens/SettingsSecurityScreen';
import { SettingsDangerAreaScreen } from '../screens/SettingsDangerAreaScreen';

export const SettingsStack = createStackNavigator<SettingsStackParamList>();

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
            options={{ title: SettingsStackRoutes.SettingsLabeling }}
            name={SettingsStackRoutes.SettingsLabeling}
            component={SettingsLabelingScreen}
        />
        <SettingsStack.Screen
            options={{ title: SettingsStackRoutes.SettingsAdvanced }}
            name={SettingsStackRoutes.SettingsAdvanced}
            component={SettingsAdvancedScreen}
        />
        <SettingsStack.Screen
            options={{ title: SettingsStackRoutes.SettingsCustomization }}
            name={SettingsStackRoutes.SettingsCustomization}
            component={SettingsCustomizationScreen}
        />
        <SettingsStack.Screen
            options={{ title: SettingsStackRoutes.SettingsSecurity }}
            name={SettingsStackRoutes.SettingsSecurity}
            component={SettingsSecurityScreen}
        />
        <SettingsStack.Screen
            options={{ title: SettingsStackRoutes.SettingsDangerArea }}
            name={SettingsStackRoutes.SettingsDangerArea}
            component={SettingsDangerAreaScreen}
        />
    </SettingsStack.Navigator>
);

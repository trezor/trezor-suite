import React from 'react';

import { createStackNavigator } from '@react-navigation/stack';

import {
    SettingsStackParamList,
    SettingsStackRoutes,
    stackNavigationOptionsConfig,
} from '@suite-native/navigation';

import { SettingsScreen } from '../screens/SettingsScreen';
import { SettingsLocalisationScreen } from '../screens/SettingsLocalisationScreen';
import { SettingsCustomizationScreen } from '../screens/SettingsCustomizationScreen';

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
            options={{ title: SettingsStackRoutes.SettingsCustomization }}
            name={SettingsStackRoutes.SettingsCustomization}
            component={SettingsCustomizationScreen}
        />
    </SettingsStack.Navigator>
);

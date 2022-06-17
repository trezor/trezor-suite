import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

import { SettingsStackRoutes, SettingsStackParamList } from './routes';
import { SettingsScreen } from '../screens/SettingsScreen';
import { SettingsLocalisationScreen } from '../screens/SettingsLocalisationScreen';
import { SettingsLabelingScreen } from '../screens/SettingsLabelingScreen';
import { SettingsAdvancedScreen } from '../screens/SettingsAdvancedScreen';

const SettingsStack = createStackNavigator<SettingsStackParamList>();

export const SettingsStackNavigator = () => (
    <SettingsStack.Navigator
        initialRouteName={SettingsStackRoutes.Settings}
        screenOptions={{ headerShown: false, gestureEnabled: true, gestureDirection: 'horizontal' }}
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
    </SettingsStack.Navigator>
);

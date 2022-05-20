import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { SettingsScreen } from '../screens/SettingsScreen';
import { SettingsDetailScreen } from '../screens/SettingsDetailScreen';
import { SettingsStackRoutes, SettingsStackParamList } from './routes';

const SettingsStack = createStackNavigator<SettingsStackParamList>();

export const SettingsStackNavigator = () => (
    <SettingsStack.Navigator
        initialRouteName={SettingsStackRoutes.Settings}
        screenOptions={{ headerShown: false, gestureEnabled: true, gestureDirection: 'horizontal' }}
    >
        <SettingsStack.Screen
            options={{ title: 'Settings' }}
            name={SettingsStackRoutes.Settings}
            component={SettingsScreen}
        />
        <SettingsStack.Screen
            options={{ title: 'SettingsDetail' }}
            name={SettingsStackRoutes.SettingsDetail}
            component={SettingsDetailScreen}
        />
    </SettingsStack.Navigator>
);

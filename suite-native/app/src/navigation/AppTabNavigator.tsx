import React from 'react';

import { BottomTabBarProps, createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import { HomeStackNavigator } from '@suite-native/module-home';
import { SettingsStackNavigator } from '@suite-native/module-settings';
import { AppTabsParamList, AppTabsRoutes, TabBar } from '@suite-native/navigation';

import { AccountsScreen } from './dummyScreens/AccountsScreen';
import { ActionScreen } from './dummyScreens/ActionScreen';
import { PricesScreen } from './dummyScreens/PricesScreen';
import { rootTabsOptions } from './routes';

const Tab = createBottomTabNavigator<AppTabsParamList>();

export const AppTabNavigator = () => (
    <Tab.Navigator
        initialRouteName={AppTabsRoutes.HomeStack}
        screenOptions={{
            headerShown: false,
            unmountOnBlur: false,
        }}
        tabBar={(props: BottomTabBarProps) => (
            <TabBar tabItemOptions={rootTabsOptions} {...props} />
        )}
    >
        <Tab.Screen name={AppTabsRoutes.HomeStack} component={HomeStackNavigator} />
        <Tab.Screen name={AppTabsRoutes.Accounts} component={AccountsScreen} />
        <Tab.Screen name={AppTabsRoutes.Action} component={ActionScreen} />
        <Tab.Screen name={AppTabsRoutes.Prices} component={PricesScreen} />
        <Tab.Screen name={AppTabsRoutes.SettingsStack} component={SettingsStackNavigator} />
    </Tab.Navigator>
);

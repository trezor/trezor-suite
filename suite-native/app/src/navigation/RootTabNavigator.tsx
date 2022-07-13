import React from 'react';

import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import { HomeStackNavigator } from '@suite-native/module-home';
import { SettingsStackNavigator } from '@suite-native/module-settings';
import { TabBar } from '@suite-native/navigation';

import { AccountsScreen } from './dummyScreens/AccountsScreen';
import { ActionScreen } from './dummyScreens/ActionScreen';
import { PricesScreen } from './dummyScreens/PricesScreen';
import { RootTabsParamList, RouteTabs, rootTabsOptions } from './routes';

const Tab = createBottomTabNavigator<RootTabsParamList>();

export const RootTabNavigator = () => (
    <Tab.Navigator
        initialRouteName={RouteTabs.HomeStack}
        screenOptions={{
            headerShown: false,
            unmountOnBlur: true,
        }}
        tabBar={props => <TabBar tabItemOptions={rootTabsOptions} {...props} />}
    >
        <Tab.Screen name={RouteTabs.HomeStack} component={HomeStackNavigator} />
        <Tab.Screen name={RouteTabs.Accounts} component={AccountsScreen} />
        <Tab.Screen name={RouteTabs.Action} component={ActionScreen} />
        <Tab.Screen name={RouteTabs.Prices} component={PricesScreen} />
        <Tab.Screen name={RouteTabs.SettingsStack} component={SettingsStackNavigator} />
    </Tab.Navigator>
);

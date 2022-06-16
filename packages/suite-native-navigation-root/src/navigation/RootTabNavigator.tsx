import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';

import { TabBar } from '@suite-native/navigation';

import { AccountsScreen } from '../dummyScreens/AccountsScreen';
import { ActionScreen } from '../dummyScreens/ActionScreen';
// import { DemoScreen } from '../dummyScreens/DemoScreen';
import { PricesScreen } from '../dummyScreens/PricesScreen';
import { SettingsScreen } from '@suite-native/settings';
import { HomeStackNavigator } from '@suite-native/home';

import { RootTabsParamList, RouteTabs, rootTabsOptions } from './routes';

const Tab = createBottomTabNavigator<RootTabsParamList>();

export const RootTabNavigator = () => (
    <NavigationContainer>
        <Tab.Navigator
            // TODO revert this before merge
            initialRouteName={RouteTabs.Settings}
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
            <Tab.Screen name={RouteTabs.Settings} component={SettingsScreen} />
        </Tab.Navigator>
    </NavigationContainer>
);

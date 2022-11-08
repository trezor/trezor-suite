import React from 'react';

import { BottomTabBarProps, createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import { HomeStackNavigator } from '@suite-native/module-home';
import { AccountsStackNavigator } from '@suite-native/module-accounts';
import { SettingsStackNavigator } from '@suite-native/module-settings';
import { AppTabsParamList, AppTabsRoutes, TabBar } from '@suite-native/navigation';
import { SendReceiveBottomSheet } from '@suite-native/module-send-receive';

import { ActionScreen } from './dummyScreens/ActionScreen';
import { rootTabsOptions } from './routes';

const Tab = createBottomTabNavigator<AppTabsParamList>();

export const AppTabNavigator = () => (
    <>
        <Tab.Navigator
            initialRouteName={AppTabsRoutes.HomeStack}
            screenOptions={{
                headerShown: false,
                unmountOnBlur: false,
            }}
            tabBar={(props: BottomTabBarProps) => (
                <TabBar
                    SendReceiveComponent={SendReceiveBottomSheet}
                    tabItemOptions={rootTabsOptions}
                    {...props}
                />
            )}
        >
            <Tab.Screen name={AppTabsRoutes.HomeStack} component={HomeStackNavigator} />
            <Tab.Screen name={AppTabsRoutes.AccountsStack} component={AccountsStackNavigator} />
            <Tab.Screen name={AppTabsRoutes.Action} component={ActionScreen} />
            <Tab.Screen name={AppTabsRoutes.SettingsStack} component={SettingsStackNavigator} />
        </Tab.Navigator>
    </>
);

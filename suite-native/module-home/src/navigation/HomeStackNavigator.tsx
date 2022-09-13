import React from 'react';

import { createStackNavigator } from '@react-navigation/stack';

import {
    HomeStackParamList,
    HomeStackRoutes,
    stackNavigationOptionsConfig,
} from '@suite-native/navigation';
import { DemoScreen } from '@suite-native/module-development';

import { HomeScreen } from '../screens/HomeScreen';

const HomeStack = createStackNavigator<HomeStackParamList>();

export const HomeStackNavigator = () => (
    <HomeStack.Navigator
        initialRouteName={HomeStackRoutes.Home}
        screenOptions={stackNavigationOptionsConfig}
    >
        <HomeStack.Screen
            options={{ title: HomeStackRoutes.Home }}
            name={HomeStackRoutes.Home}
            component={HomeScreen}
        />
        <HomeStack.Screen
            options={{ title: HomeStackRoutes.Demo }}
            name={HomeStackRoutes.Demo}
            component={DemoScreen}
        />
    </HomeStack.Navigator>
);

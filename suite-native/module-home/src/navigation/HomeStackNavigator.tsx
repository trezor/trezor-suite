import React from 'react';

import { createNativeStackNavigator } from '@react-navigation/native-stack';

import {
    HomeStackParamList,
    HomeStackRoutes,
    stackNavigationOptionsConfig,
} from '@suite-native/navigation';
import { AccountDetailScreen } from '@suite-native/module-accounts';

import { HomeScreen } from '../screens/HomeScreen';

const HomeStack = createNativeStackNavigator<HomeStackParamList>();

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
            options={{ title: HomeStackRoutes.AccountDetail }}
            name={HomeStackRoutes.AccountDetail}
            component={AccountDetailScreen}
        />
    </HomeStack.Navigator>
);

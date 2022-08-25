import React from 'react';

import { createStackNavigator } from '@react-navigation/stack';

import { stackNavigationOptionsConfig } from '@suite-native/navigation';
import { OnboardingStackNavigator } from '@suite-native/module-onboarding';

import { HomeScreen } from '../screens/HomeScreen';
import { HomeStackParamList, HomeStackRoutes } from './routes';

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
        <HomeStack.Screen name={HomeStackRoutes.Import} component={OnboardingStackNavigator} />
    </HomeStack.Navigator>
);

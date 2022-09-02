import React from 'react';
import { useSelector } from 'react-redux';

import { createStackNavigator } from '@react-navigation/stack';

import {
    OnboardingStackNavigator,
    selectIsOnboardingFinished,
} from '@suite-native/module-onboarding';
import { stackNavigationOptionsConfig, RootStackRoutes } from '@suite-native/navigation';

import { RootStackParamList } from './routes';
import { RootTabNavigator } from './RootTabNavigator';

const Stack = createStackNavigator<RootStackParamList>();

export const RootStackNavigator = () => {
    const isOnboardingFinished = useSelector(selectIsOnboardingFinished);
    // NOTE: Skip onboarding for development right now to speed up app loading
    let skipOnboarding = isOnboardingFinished || process.env.NODE_ENV === 'development';
    skipOnboarding = false;

    return (
        <Stack.Navigator
            initialRouteName={skipOnboarding ? RootStackRoutes.App : RootStackRoutes.Import}
            screenOptions={stackNavigationOptionsConfig}
        >
            <Stack.Screen name={RootStackRoutes.App} component={RootTabNavigator} />
            <Stack.Screen name={RootStackRoutes.Import} component={OnboardingStackNavigator} />
        </Stack.Navigator>
    );
};

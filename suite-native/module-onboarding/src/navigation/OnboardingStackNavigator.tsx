import React from 'react';

import { createStackNavigator } from '@react-navigation/stack';

import { stackNavigationOptionsConfig } from '@suite-native/navigation';

import { OnboardingStackParamList, OnboardingStackRoutes } from './routes';
import { OnboardingIntro } from '../screens/OnboardingIntro';
import { OnboardingXPub } from '../screens/OnboardingXPub';
import { OnboardingFetching } from '../screens/OnboardingFetching';
import { OnboardingAssets } from '../screens/OnboardingAssets';

export const OnboardingStack = createStackNavigator<OnboardingStackParamList>();

export const OnboardingStackNavigator = () => (
    <OnboardingStack.Navigator
        initialRouteName={OnboardingStackRoutes.Onboarding}
        screenOptions={stackNavigationOptionsConfig}
    >
        <OnboardingStack.Screen
            name={OnboardingStackRoutes.Onboarding}
            component={OnboardingIntro}
        />
        <OnboardingStack.Screen
            name={OnboardingStackRoutes.OnboardingXPub}
            component={OnboardingXPub}
        />
        <OnboardingStack.Screen
            name={OnboardingStackRoutes.OnboardingFetching}
            component={OnboardingFetching}
        />
        <OnboardingStack.Screen
            name={OnboardingStackRoutes.OnboardingAssets}
            component={OnboardingAssets}
        />
    </OnboardingStack.Navigator>
);

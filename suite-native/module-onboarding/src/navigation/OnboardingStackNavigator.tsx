import React from 'react';

import { createStackNavigator } from '@react-navigation/stack';

import { stackNavigationOptionsConfig } from '@suite-native/navigation';

import { OnboardingStackParamList, OnboardingStackRoutes } from './routes';
import { OnboardingIntro } from '../screens/OnboardingIntro';
import { OnboardingXpubScan } from '../screens/OnboardingXpubScan';
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
            name={OnboardingStackRoutes.OnboardingXpubScan}
            component={OnboardingXpubScan}
        />
        <OnboardingStack.Screen
            name={OnboardingStackRoutes.OnboardingAssets}
            component={OnboardingAssets}
        />
    </OnboardingStack.Navigator>
);

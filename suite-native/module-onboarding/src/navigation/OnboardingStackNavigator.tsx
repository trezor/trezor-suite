import React from 'react';

import { createStackNavigator } from '@react-navigation/stack';

import { stackNavigationOptionsConfig } from '@suite-native/navigation';

import { OnboardingStackParamList, OnboardingStackRoutes } from './routes';
import { OnboardingIntro } from '../screens/OnboardingIntro';
import { OnboardingXPub } from '../screens/OnboardingXPub';

export const OnboardingStack = createStackNavigator<OnboardingStackParamList>();

export const OnboardingStackNavigator = ({
    onOnboardingCompleted,
}: {
    onOnboardingCompleted: () => void;
}) => (
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
    </OnboardingStack.Navigator>
);

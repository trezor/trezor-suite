import React from 'react';

import { createStackNavigator } from '@react-navigation/stack';

import {
    OnboardingStackRoutes,
    OnboardingStackParamList,
    stackNavigationOptionsConfig,
} from '@suite-native/navigation';

import { OnboardingIntroScreen } from '../screens/OnboardingIntroScreen';

export const OnboardingStack = createStackNavigator<OnboardingStackParamList>();

export const OnboardingStackNavigator = () => (
    <OnboardingStack.Navigator screenOptions={stackNavigationOptionsConfig}>
        <OnboardingStack.Screen
            name={OnboardingStackRoutes.Onboarding}
            component={OnboardingIntroScreen}
        />
    </OnboardingStack.Navigator>
);

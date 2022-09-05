import React from 'react';
import { useSelector } from 'react-redux';

import { createStackNavigator } from '@react-navigation/stack';

import { stackNavigationOptionsConfig } from '@suite-native/navigation';

import { AssetsStackParamList, AssetsStackRoutes } from './routes';
import { OnboardingIntro } from '../screens/OnboardingIntro';
import { XpubScan } from '../screens/XpubScan';
import { AssetsImport } from '../screens/AssetsImport';
import { selectIsOnboardingFinished } from '../slice';

export const AssetsStack = createStackNavigator<AssetsStackParamList>();

export const AssetsStackNavigator = () => {
    const isOnboardingFinished = useSelector(selectIsOnboardingFinished);

    return (
        <AssetsStack.Navigator screenOptions={stackNavigationOptionsConfig}>
            {!isOnboardingFinished && (
                <AssetsStack.Screen
                    name={AssetsStackRoutes.Onboarding}
                    component={OnboardingIntro}
                />
            )}
            <AssetsStack.Screen name={AssetsStackRoutes.XpubScan} component={XpubScan} />
            <AssetsStack.Screen name={AssetsStackRoutes.AssetsImport} component={AssetsImport} />
        </AssetsStack.Navigator>
    );
};

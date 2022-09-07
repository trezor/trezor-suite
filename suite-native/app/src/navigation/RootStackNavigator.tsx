import React from 'react';
import { useSelector } from 'react-redux';

import { createStackNavigator } from '@react-navigation/stack';

import { AccountsImportStackNavigator } from '@suite-native/module-accounts-import';
import { OnboardingStackNavigator } from '@suite-native/module-onboarding';
import {
    RootStackParamList,
    RootStackRoutes,
    stackNavigationOptionsConfig,
} from '@suite-native/navigation';
import { selectIsOnboardingFinished } from '@suite-native/module-settings';

import { AppTabNavigator } from './AppTabNavigator';

const RootStack = createStackNavigator<RootStackParamList>();

export const RootStackNavigator = () => {
    const isOnboardingFinished = useSelector(selectIsOnboardingFinished);

    return (
        <RootStack.Navigator
            initialRouteName={
                isOnboardingFinished ? RootStackRoutes.App : RootStackRoutes.Onboarding
            }
            screenOptions={stackNavigationOptionsConfig}
        >
            {!isOnboardingFinished && (
                <RootStack.Screen
                    name={RootStackRoutes.Onboarding}
                    component={OnboardingStackNavigator}
                />
            )}
            <RootStack.Screen name={RootStackRoutes.App} component={AppTabNavigator} />
            <RootStack.Screen
                name={RootStackRoutes.AccountsImport}
                component={AccountsImportStackNavigator}
            />
        </RootStack.Navigator>
    );
};

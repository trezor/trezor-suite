import React from 'react';
import { useSelector } from 'react-redux';

import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { AccountSettingsScreen } from '@suite-native/module-accounts';
import { AccountsImportStackNavigator } from '@suite-native/module-accounts-import';
import {
    RootStackParamList,
    RootStackRoutes,
    stackNavigationOptionsConfig,
} from '@suite-native/navigation';
import {
    selectIsOnboardingFinished,
    selectIsAccountImportFinished,
} from '@suite-native/module-settings';
import { DevUtilsStackNavigator } from '@suite-native/module-dev-utils';
import { TransactionDetailScreen } from '@suite-native/transactions';
import { OnboardingStackNavigator } from '@suite-native/module-onboarding';

import { AppTabNavigator } from './AppTabNavigator';

const RootStack = createNativeStackNavigator<RootStackParamList>();

export const RootStackNavigator = () => {
    const isOnboardingFinished = useSelector(selectIsOnboardingFinished);
    const isAccountImportFinished = useSelector(selectIsAccountImportFinished);

    const getInitialRouteName = () => {
        if (isOnboardingFinished && isAccountImportFinished) {
            return RootStackRoutes.AppTabs;
        }
        if (isOnboardingFinished) {
            return RootStackRoutes.AccountsImport;
        }
        return RootStackRoutes.Onboarding;
    };

    return (
        <RootStack.Navigator
            initialRouteName={getInitialRouteName()}
            screenOptions={stackNavigationOptionsConfig}
        >
            <RootStack.Screen
                name={RootStackRoutes.Onboarding}
                component={OnboardingStackNavigator}
            />
            <RootStack.Screen name={RootStackRoutes.AppTabs} component={AppTabNavigator} />
            <RootStack.Screen
                name={RootStackRoutes.AccountsImport}
                component={AccountsImportStackNavigator}
            />
            <RootStack.Screen
                options={{ title: RootStackRoutes.AccountSettings }}
                name={RootStackRoutes.AccountSettings}
                component={AccountSettingsScreen}
            />
            <RootStack.Screen
                options={{ title: RootStackRoutes.TransactionDetail }}
                name={RootStackRoutes.TransactionDetail}
                component={TransactionDetailScreen}
            />
            <RootStack.Screen
                name={RootStackRoutes.DevUtilsStack}
                component={DevUtilsStackNavigator}
            />
        </RootStack.Navigator>
    );
};

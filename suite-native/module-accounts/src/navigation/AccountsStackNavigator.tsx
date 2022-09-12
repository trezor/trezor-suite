import React from 'react';

import { createStackNavigator } from '@react-navigation/stack';

import {
    AccountsStackParamList,
    AccountsStackRoutes,
    stackNavigationOptionsConfig,
} from '@suite-native/navigation';

import { AccountsScreen } from '../screens/AccountsScreen';
import { AccountDetailScreen } from '../screens/AccountDetailScreen';

const AccountsStack = createStackNavigator<AccountsStackParamList>();

export const AccountsStackNavigator = () => (
    <AccountsStack.Navigator
        screenOptions={stackNavigationOptionsConfig}
        initialRouteName={AccountsStackRoutes.Accounts}
    >
        <AccountsStack.Screen
            options={{ title: AccountsStackRoutes.Accounts }}
            name={AccountsStackRoutes.Accounts}
            component={AccountsScreen}
        />
        <AccountsStack.Screen
            options={{ title: AccountsStackRoutes.AccountDetail }}
            name={AccountsStackRoutes.AccountDetail}
            component={AccountDetailScreen}
        />
    </AccountsStack.Navigator>
);

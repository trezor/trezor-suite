import React from 'react';

import { createStackNavigator } from '@react-navigation/stack';

import {
    AccountsStackParamList,
    AccountsStackRoutes,
    stackNavigationOptionsConfig,
} from '@suite-native/navigation';

import { AccountsScreen } from '../screens/AccountsScreen';
import { AccountDetailScreen } from '../screens/AccountDetailScreen';
import { AccountDetailSettings } from '../screens/AccountDetailSettings';

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
        <AccountsStack.Screen
            options={{ title: AccountsStackRoutes.AccountDetailSettings }}
            name={AccountsStackRoutes.AccountDetailSettings}
            component={AccountDetailSettings}
        />
    </AccountsStack.Navigator>
);

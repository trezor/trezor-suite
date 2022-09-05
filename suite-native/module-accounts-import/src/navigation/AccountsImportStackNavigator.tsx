import React from 'react';

import { createStackNavigator } from '@react-navigation/stack';

import {
    AccountsImportStackParamList,
    AccountsImportStackRoutes,
    stackNavigationOptionsConfig,
} from '@suite-native/navigation';

import { XpubScanScreen } from '../screens/XpubScanScreen';
import { AccountsImportScreen } from '../screens/AccountsImportScreen';

export const AccountsImportStack = createStackNavigator<AccountsImportStackParamList>();

export const AccountsImportStackNavigator = () => (
    <AccountsImportStack.Navigator screenOptions={stackNavigationOptionsConfig}>
        <AccountsImportStack.Screen
            name={AccountsImportStackRoutes.XpubScan}
            component={XpubScanScreen}
        />
        <AccountsImportStack.Screen
            name={AccountsImportStackRoutes.AccountImport}
            component={AccountsImportScreen}
        />
    </AccountsImportStack.Navigator>
);

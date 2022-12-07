import React from 'react';

import { createStackNavigator } from '@react-navigation/stack';

import {
    AccountsImportStackParamList,
    AccountsImportStackRoutes,
    stackNavigationOptionsConfig,
} from '@suite-native/navigation';

import { SelectCoinScreen } from '../screens/SelectCoinScreen';
import { XpubScanScreen } from '../screens/XpubScanScreen';
import { AccountsImportScreen } from '../screens/AccountsImportScreen';
import { ScanQRCodeModalScreen } from '../screens/ScanQRCodeModalScreen';

export const AccountsImportStack = createStackNavigator<AccountsImportStackParamList>();

export const AccountsImportStackNavigator = () => (
    <AccountsImportStack.Navigator screenOptions={stackNavigationOptionsConfig}>
        <AccountsImportStack.Group>
            <AccountsImportStack.Screen
                name={AccountsImportStackRoutes.SelectCoin}
                component={SelectCoinScreen}
            />
            <AccountsImportStack.Screen
                name={AccountsImportStackRoutes.XpubScan}
                component={XpubScanScreen}
            />
            <AccountsImportStack.Screen
                name={AccountsImportStackRoutes.AccountImport}
                component={AccountsImportScreen}
            />
        </AccountsImportStack.Group>
        <AccountsImportStack.Group screenOptions={{ presentation: 'modal' }}>
            <AccountsImportStack.Screen
                name={AccountsImportStackRoutes.XpubScanModal}
                component={ScanQRCodeModalScreen}
            />
        </AccountsImportStack.Group>
    </AccountsImportStack.Navigator>
);

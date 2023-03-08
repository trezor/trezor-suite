import React from 'react';

import { createNativeStackNavigator } from '@react-navigation/native-stack';

import {
    SendReceiveStackParamList,
    SendReceiveStackRoutes,
    stackNavigationOptionsConfig,
} from '@suite-native/navigation';

import { ReceiveAccountsScreen } from '../screens/ReceiveAccountsScreen';
import { ReceiveScreen } from '../screens/ReceiveScreen';

const SendReceiveStack = createNativeStackNavigator<SendReceiveStackParamList>();

export const SendReceiveStackNavigator = () => (
    <SendReceiveStack.Navigator
        initialRouteName={SendReceiveStackRoutes.ReceiveAccounts}
        screenOptions={stackNavigationOptionsConfig}
    >
        <SendReceiveStack.Screen
            name={SendReceiveStackRoutes.ReceiveAccounts}
            component={ReceiveAccountsScreen}
        />
        <SendReceiveStack.Screen name={SendReceiveStackRoutes.Receive} component={ReceiveScreen} />
    </SendReceiveStack.Navigator>
);

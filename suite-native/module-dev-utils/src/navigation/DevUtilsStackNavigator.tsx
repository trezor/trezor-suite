import React from 'react';

import { createStackNavigator } from '@react-navigation/stack';

import {
    DevUtilsStackParamList,
    DevUtilsStackRoutes,
    stackNavigationOptionsConfig,
} from '@suite-native/navigation';

import { DevUtilsScreen } from '../screens/DevUtilsScreen';
import { DemoScreen } from '../screens/DemoScreen';

const DevUtilsStack = createStackNavigator<DevUtilsStackParamList>();

export const DevUtilsStackNavigator = () => (
    <DevUtilsStack.Navigator
        initialRouteName={DevUtilsStackRoutes.DevUtils}
        screenOptions={stackNavigationOptionsConfig}
    >
        <DevUtilsStack.Screen
            options={{ title: DevUtilsStackRoutes.DevUtils }}
            name={DevUtilsStackRoutes.DevUtils}
            component={DevUtilsScreen}
        />
        <DevUtilsStack.Screen
            options={{ title: DevUtilsStackRoutes.Demo }}
            name={DevUtilsStackRoutes.Demo}
            component={DemoScreen}
        />
    </DevUtilsStack.Navigator>
);

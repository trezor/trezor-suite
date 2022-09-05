import React from 'react';
import { useSelector } from 'react-redux';

import { createStackNavigator } from '@react-navigation/stack';
import { RootStackParamList } from 'suite-native/module-home';

import { AssetsStackNavigator, selectIsOnboardingFinished } from '@suite-native/module-assets';
import { stackNavigationOptionsConfig } from '@suite-native/navigation';

import { AppTabNavigator } from './AppTabNavigator';
import { RootStackRoutes } from './routes';

const RootStack = createStackNavigator<RootStackParamList>();

export const RootStackNavigator = () => {
    const isOnboardingFinished = useSelector(selectIsOnboardingFinished);

    return (
        <RootStack.Navigator
            initialRouteName={isOnboardingFinished ? RootStackRoutes.App : RootStackRoutes.Assets}
            screenOptions={stackNavigationOptionsConfig}
        >
            <RootStack.Screen name={RootStackRoutes.App} component={AppTabNavigator} />
            <RootStack.Screen name={RootStackRoutes.Assets} component={AssetsStackNavigator} />
        </RootStack.Navigator>
    );
};

import { createStackNavigator } from '@react-navigation/stack';
import React from 'react';
import { HomeDetailScreen } from '../screens/HomeDetailScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { HomeStackParamList, HomeStackRoutes } from './routes';

const HomeStack = createStackNavigator<HomeStackParamList>();

export const HomeStackNavigator = () => (
    <HomeStack.Navigator
        initialRouteName={HomeStackRoutes.Home}
        screenOptions={{ headerShown: false, gestureEnabled: true, gestureDirection: 'horizontal' }}
    >
        <HomeStack.Screen
            options={{ title: 'Home' }}
            name={HomeStackRoutes.Home}
            component={HomeScreen}
        />
        <HomeStack.Screen
            options={{ title: 'HomeDetail' }}
            name={HomeStackRoutes.HomeDetail}
            component={HomeDetailScreen}
        />
    </HomeStack.Navigator>
);

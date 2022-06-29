import React from 'react';

import { NavigationContainer } from '@react-navigation/native';
import { store } from '@suite-native/state';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider } from 'react-redux';

import { RootTabNavigator } from './navigation/RootTabNavigator';
import { StylesProvider } from './StylesProvider';

export const App = () => (
    <GestureHandlerRootView style={{ flex: 1 }}>
        <NavigationContainer>
            <Provider store={store}>
                <SafeAreaProvider>
                    <StylesProvider>
                        <RootTabNavigator />
                    </StylesProvider>
                </SafeAreaProvider>
            </Provider>
        </NavigationContainer>
    </GestureHandlerRootView>
);

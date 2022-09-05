import React, { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider, useDispatch } from 'react-redux';

import { NavigationContainer } from '@react-navigation/native';

import { connectInitThunk } from '@suite-common/connect-init';
import { store } from '@suite-native/state';
import { initBlockchainThunk } from '@suite-common/wallet-core';

import { RootStackNavigator } from './navigation/RootStackNavigator';
import { StylesProvider } from './StylesProvider';
import { useSplashScreen } from './hooks/useSplashScreen';

const AppComponent = () => {
    const dispatch = useDispatch();

    useEffect(() => {
        const initActions = async () => {
            await dispatch(connectInitThunk()).unwrap();
            await dispatch(initBlockchainThunk()).unwrap();
        };
        initActions().catch(console.error);
    }, [dispatch]);

    return <RootStackNavigator />;
};

export const App = () => {
    useSplashScreen();

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <NavigationContainer>
                <Provider store={store}>
                    <SafeAreaProvider>
                        <StylesProvider>
                            <AppComponent />
                        </StylesProvider>
                    </SafeAreaProvider>
                </Provider>
            </NavigationContainer>
        </GestureHandlerRootView>
    );
};

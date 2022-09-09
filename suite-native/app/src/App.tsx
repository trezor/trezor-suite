import React, { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider, useDispatch } from 'react-redux';

import { NavigationContainer } from '@react-navigation/native';

import { connectInitThunk } from '@suite-common/connect-init';
import { store, storePersistor } from '@suite-native/state';
import { initBlockchainThunk, reconnectBlockchainThunk } from '@suite-common/wallet-core';
import { StorageProvider } from '@suite-native/storage';
import { FormatterProvider } from '@suite-common/formatters';

import { RootStackNavigator } from './navigation/RootStackNavigator';
import { StylesProvider } from './StylesProvider';
import { useSplashScreen } from './hooks/useSplashScreen';

const AppComponent = () => {
    const dispatch = useDispatch();

    useEffect(() => {
        const initActions = async () => {
            await dispatch(connectInitThunk()).unwrap();
            await dispatch(initBlockchainThunk()).unwrap();
            /* Invoke reconnect manually here because we need to have fiat rates initialized
             immediately after the app is loaded.
             */
            await dispatch(reconnectBlockchainThunk('btc')).unwrap();
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
                    <StorageProvider persistor={storePersistor}>
                        <SafeAreaProvider>
                            <StylesProvider>
                                <FormatterProvider
                                    config={{
                                        locale: 'en',
                                        areSatsDisplayed: true,
                                    }}
                                >
                                    <AppComponent />
                                </FormatterProvider>
                            </StylesProvider>
                        </SafeAreaProvider>
                    </StorageProvider>
                </Provider>
            </NavigationContainer>
        </GestureHandlerRootView>
    );
};

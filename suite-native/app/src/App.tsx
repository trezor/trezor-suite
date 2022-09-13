import React, { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider, useDispatch } from 'react-redux';

import { PersistGate } from 'redux-persist/integration/react';
import { NavigationContainer } from '@react-navigation/native';

import { connectInitThunk } from '@suite-common/connect-init';
import { store, persistor } from '@suite-native/state';
import { initBlockchainThunk, reconnectBlockchainThunk } from '@suite-common/wallet-core';

import { RootStackNavigator } from './navigation/RootStackNavigator';
import { StylesProvider } from './StylesProvider';
import { useSplashScreen } from './hooks/useSplashScreen';

const AppComponent = () => {
    const dispatch = useDispatch();

    useEffect(() => {
        const initActions = async () => {
            await dispatch(connectInitThunk()).unwrap();
            await dispatch(initBlockchainThunk()).unwrap();
            // reconnect blockchain (it emits BLOCKCHAIN.CONNECT) - we need to have fiat rates when the app is loaded.
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
                    <PersistGate loading={null} persistor={persistor}>
                        <SafeAreaProvider>
                            <StylesProvider>
                                <AppComponent />
                            </StylesProvider>
                        </SafeAreaProvider>
                    </PersistGate>
                </Provider>
            </NavigationContainer>
        </GestureHandlerRootView>
    );
};

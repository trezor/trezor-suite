import React, { useEffect, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider, useDispatch } from 'react-redux';
import { IntlProvider } from 'react-intl';

import { NavigationContainer } from '@react-navigation/native';

// FIXME this is only temporary until Intl refactor will be finished
import enMessages from '@trezor/suite-data/files/translations/en.json';
import { connectInitThunk } from '@suite-common/connect-init';
import { store, storePersistor } from '@suite-native/state';
import { initBlockchainThunk, reconnectBlockchainThunk } from '@suite-common/wallet-core';
import { StorageProvider } from '@suite-native/storage';
import { FormatterProvider } from '@suite-common/formatters';

import { RootStackNavigator } from './navigation/RootStackNavigator';
import { StylesProvider } from './StylesProvider';
import { useSplashScreen } from './hooks/useSplashScreen';
import { useFormattersConfig } from './hooks/useFormattersConfig';

const AppComponent = () => {
    const dispatch = useDispatch();
    const formattersConfig = useFormattersConfig();
    const [isConnectInitialized, setIsConnectInitialized] = useState(false);

    useEffect(() => {
        const initActions = async () => {
            await dispatch(connectInitThunk()).unwrap();
            await dispatch(initBlockchainThunk()).unwrap();
            setIsConnectInitialized(true);
            /* Invoke reconnect manually here because we need to have fiat rates initialized
             immediately after the app is loaded.
             */
            await dispatch(reconnectBlockchainThunk('btc')).unwrap();
        };
        initActions().catch(console.error);
    }, [dispatch]);

    if (!isConnectInitialized) {
        return null;
    }

    return (
        <FormatterProvider config={formattersConfig}>
            <RootStackNavigator />
        </FormatterProvider>
    );
};

export const App = () => {
    useSplashScreen();

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <IntlProvider locale="en" defaultLocale="en" messages={enMessages}>
                <NavigationContainer>
                    <Provider store={store}>
                        <StorageProvider persistor={storePersistor}>
                            <SafeAreaProvider>
                                <StylesProvider>
                                    <AppComponent />
                                </StylesProvider>
                            </SafeAreaProvider>
                        </StorageProvider>
                    </Provider>
                </NavigationContainer>
            </IntlProvider>
        </GestureHandlerRootView>
    );
};

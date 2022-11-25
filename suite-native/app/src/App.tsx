import React, { useEffect, useState } from 'react';
import { Alert } from 'react-native';
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
import { enabledNetworks } from '@suite-native/config';

import { RootStackNavigator } from './navigation/RootStackNavigator';
import { StylesProvider } from './StylesProvider';
import { useSplashScreen } from './hooks/useSplashScreen';
import { useFormattersConfig } from './hooks/useFormattersConfig';

// Recommended approach from react docs if you really want to run something just once
let isConnectInitializedGlobal = false;

const AppComponent = () => {
    const dispatch = useDispatch();
    const formattersConfig = useFormattersConfig();
    const [isConnectInitialized, setIsConnectInitialized] = useState(isConnectInitializedGlobal);

    useEffect(() => {
        const initActions = async () => {
            try {
                if (isConnectInitialized) return;

                // TODO: proper error handling for all these thunks
                await dispatch(connectInitThunk()).unwrap();

                setIsConnectInitialized(true);
                isConnectInitializedGlobal = true;

                await dispatch(initBlockchainThunk()).unwrap();
                /* Invoke reconnect manually here because we need to have fiat rates initialized
                 * immediately after the app is loaded.
                 */

                /* TODO We should only reconnect for accounts that we currently need.
                   Currently all supported networks get reconnected but this can raise some
                   performance problems because of making calls to blockbook that are unnecessary.
                */
                const promises = enabledNetworks.map(network =>
                    dispatch(reconnectBlockchainThunk(network)),
                );
                await Promise.all(promises);
            } catch (error) {
                Alert.alert('Error', error?.message ?? 'Unknown error');
                console.error(error.message);
            }
        };
        initActions();
    }, [dispatch, isConnectInitialized]);

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

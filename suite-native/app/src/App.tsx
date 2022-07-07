import { NavigationContainer } from '@react-navigation/native';
import React, { useCallback, useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider } from 'react-redux';

import { store } from '@suite-native/state';
import TrezorConnect from '@trezor/connect';

import { RootTabNavigator } from './navigation/RootTabNavigator';
import { StylesProvider } from './StylesProvider';

const connectOptions = {
    debug: true,
    manifest: {
        email: 'info@trezor.io',
        appUrl: '@trezor/suite-native',
    },
};

export const App = () => {
    const getAccountInfo = useCallback(() => {
        TrezorConnect.getAccountInfo({
            coin: 'btc',
            descriptor:
                'zpub6rszzdAK6RuafeRwyN8z1cgWcXCuKbLmjjfnrW4fWKtcoXQ8787214pNJjnBG5UATyghuNzjn6Lfp5k5xymrLFJnCy46bMYJPyZsbpFGagT',
        })
            .then(accountInfo => {
                console.log('Account info result: ', JSON.stringify(accountInfo, null, 2));
            })
            .catch(error => {
                console.log('getAccountInfo failed: ', JSON.stringify(error));
            });
    }, []);

    useEffect(() => {
        TrezorConnect.init(connectOptions)
            .then(initResult => {
                console.log('Init result: ', initResult);
                getAccountInfo();
            })
            .catch(error => {
                console.log('Init failed', JSON.stringify(error.code));
            });
    }, [getAccountInfo]);

    return (
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
};

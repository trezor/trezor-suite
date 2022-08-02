import React, { useCallback, useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider, useDispatch, useSelector } from 'react-redux';

import { createAction } from '@reduxjs/toolkit';
import { NavigationContainer } from '@react-navigation/native';

import { prepareConnectInitThunk } from '@suite-common/connect-init';
import {
    OnboardingStackNavigator,
    selectIsOnboardingFinished,
} from '@suite-native/module-onboarding';
import { store } from '@suite-native/state';
import TrezorConnect from '@trezor/connect';

import { RootTabNavigator } from './navigation/RootTabNavigator';
import { StylesProvider } from './StylesProvider';

const AppComponent = () => {
    const dispatch = useDispatch();
    const isOnboardingFinished = useSelector(selectIsOnboardingFinished);

    const getAccountInfo = useCallback(() => {
        TrezorConnect.getAccountInfo({
            coin: 'btc',
            descriptor:
                'zpub6rszzdAK6RuafeRwyN8z1cgWcXCuKbLmjjfnrW4fWKtcoXQ8787214pNJjnBG5UATyghuNzjn6Lfp5k5xymrLFJnCy46bMYJPyZsbpFGagT',
        })
            .then(accountInfo => {
                // eslint-disable-next-line no-console
                console.log('Account info result: ', JSON.stringify(accountInfo, null, 2));
            })
            .catch(error => {
                // eslint-disable-next-line no-console
                console.log('getAccountInfo failed: ', JSON.stringify(error));
            });
    }, []);

    useEffect(() => {
        const noOperation = createAction('noOperation');

        // TODO handle possible error
        dispatch(
            prepareConnectInitThunk({
                actions: {
                    lockDevice: noOperation,
                },
                selectors: {
                    selectEnabledNetworks: () => [],
                    selectIsPendingTransportEvent: () => false,
                },
                initSettings: {
                    debug: true,
                    manifest: {
                        email: 'info@trezor.io',
                        appUrl: '@trezor/suite-native',
                    },
                },
            }),
        );

        // FIXME: remove later - only for testing purposes if we can get account info result.
        getAccountInfo();
    }, [dispatch, getAccountInfo]);

    if (!isOnboardingFinished) {
        return <OnboardingStackNavigator />;
    }
    return <RootTabNavigator />;
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

import React, { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider, useSelector } from 'react-redux';

import { NavigationContainer } from '@react-navigation/native';

import {
    OnboardingStackNavigator,
    selectIsOnboardingFinished,
} from '@suite-native/module-onboarding';
import { store } from '@suite-native/state';
import TrezorConnect from '@trezor/connect';

import { RootTabNavigator } from './navigation/RootTabNavigator';
import { StylesProvider } from './StylesProvider';
import { useSplashScreen } from './hooks/useSplashScreen';

const connectOptions = {
    debug: true,
    manifest: {
        email: 'info@trezor.io',
        appUrl: '@trezor/suite-native',
    },
};

const AppComponent = () => {
    const isOnboardingFinished = useSelector(selectIsOnboardingFinished);

    useEffect(() => {
        TrezorConnect.init(connectOptions)
            .then(initResult => {
                // eslint-disable-next-line no-console
                console.log('Init result: ', initResult);
            })
            .catch(error => {
                // eslint-disable-next-line no-console
                console.log('Init failed', JSON.stringify(error.code));
            });
    }, []);

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

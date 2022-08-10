import React, { useEffect } from 'react';
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

import { RootTabNavigator } from './navigation/RootTabNavigator';
import { StylesProvider } from './StylesProvider';
import { useSplashScreen } from './hooks/useSplashScreen';

const noOperation = createAction('noOperation');
const connectInitThunk = prepareConnectInitThunk({
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
});

const AppComponent = () => {
    const dispatch = useDispatch();
    const isOnboardingFinished = useSelector(selectIsOnboardingFinished);

    useEffect(() => {
        // TODO handle possible error
        dispatch(connectInitThunk());
    }, [dispatch]);

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

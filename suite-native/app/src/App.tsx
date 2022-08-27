import React, { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider, useDispatch, useSelector } from 'react-redux';

import { NavigationContainer } from '@react-navigation/native';

import { connectInitThunk } from '@suite-common/connect-init';
import {
    OnboardingStackNavigator,
    selectIsOnboardingFinished,
} from '@suite-native/module-onboarding';
import { store } from '@suite-native/state';

import { RootTabNavigator } from './navigation/RootTabNavigator';
import { StylesProvider } from './StylesProvider';
import { useSplashScreen } from './hooks/useSplashScreen';

const AppComponent = () => {
    const dispatch = useDispatch();
    const isOnboardingFinished = useSelector(selectIsOnboardingFinished);

    useEffect(() => {
        // TODO handle possible error
        dispatch(connectInitThunk());
    }, [dispatch]);

    // NOTE: Skip onboarding for development right now to speed up app loading
    if (isOnboardingFinished || process.env.NODE_ENV === 'development') {
        return <RootTabNavigator />;
    }
    return <OnboardingStackNavigator />;
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

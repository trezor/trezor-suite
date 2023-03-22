import React, { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { IntlProvider } from 'react-intl';

import * as SplashScreen from 'expo-splash-screen';
import { NavigationContainer } from '@react-navigation/native';
// FIXME this is only temporary until Intl refactor will be finished
import * as Sentry from '@sentry/react-native';

import enMessages from '@trezor/suite-data/files/translations/en.json';
import { selectIsAppReady, selectIsConnectInitialized, StoreProvider } from '@suite-native/state';
// import { NotificationRenderer } from '@suite-native/notifications';
import { ToastRenderer } from '@suite-native/toasts';
import { FormatterProvider } from '@suite-common/formatters';

import { RootStackNavigator } from './navigation/RootStackNavigator';
import { StylesProvider } from './StylesProvider';
import { useFormattersConfig } from './hooks/useFormattersConfig';
import { applicationInit } from './initActions';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

const AppComponent = () => {
    const dispatch = useDispatch();
    const formattersConfig = useFormattersConfig();
    const isAppReady = useSelector(selectIsAppReady);
    const isConnectInitialized = useSelector(selectIsConnectInitialized);

    useEffect(() => {
        if (!isConnectInitialized) {
            dispatch(applicationInit());
        }
    }, [dispatch, isConnectInitialized]);

    useEffect(() => {
        if (isAppReady) {
            SplashScreen.hideAsync();
        }
    }, [isAppReady]);

    if (!isAppReady) {
        return null;
    }

    return (
        <FormatterProvider config={formattersConfig}>
            {/* Notifications are disabled until the problem with after-import notifications flooding is solved. */}
            {/* More here: https://github.com/trezor/trezor-suite/issues/7721  */}
            {/* <NotificationRenderer> */}
            <ToastRenderer>
                <RootStackNavigator />
            </ToastRenderer>
            {/* </NotificationRenderer> */}
        </FormatterProvider>
    );
};

if (!__DEV__) {
    // IMPORTANT! This naive implementation of error boundary is only for development purposes.
    // It should never make it to production release, because there is no sensitive data filtering.
    Sentry.init({
        dsn: 'https://d473f56df60c4974ae3f3ce00547c2a9@o117836.ingest.sentry.io/4504214699245568',
        // Set tracesSampleRate to 1.0 to capture 100% of transactions for performance monitoring.
        // We recommend adjusting this value in production.
        tracesSampleRate: 1.0,
    });
}

const PureApp = () => (
    <GestureHandlerRootView style={{ flex: 1 }}>
        <IntlProvider locale="en" defaultLocale="en" messages={enMessages}>
            <NavigationContainer>
                <StoreProvider>
                    <SafeAreaProvider>
                        <StylesProvider>
                            <AppComponent />
                        </StylesProvider>
                    </SafeAreaProvider>
                </StoreProvider>
            </NavigationContainer>
        </IntlProvider>
    </GestureHandlerRootView>
);

export const App = Sentry.wrap(PureApp);

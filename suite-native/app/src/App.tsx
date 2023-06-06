import React, { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { IntlProvider } from 'react-intl';

import * as SplashScreen from 'expo-splash-screen';
import * as Sentry from '@sentry/react-native';

// FIXME this is only temporary until Intl refactor will be finished
import enMessages from '@trezor/suite-data/files/translations/en.json';
import { selectIsAppReady, selectIsConnectInitialized, StoreProvider } from '@suite-native/state';
// import { NotificationRenderer } from '@suite-native/notifications';
import { ToastRenderer } from '@suite-native/toasts';
import { FormatterProvider } from '@suite-common/formatters';
import { AlertRenderer } from '@suite-native/alerts';
import { NavigationContainerWithAnalytics } from '@suite-native/navigation';
import { useBiometrics } from '@suite-native/biometrics';

import { RootStackNavigator } from './navigation/RootStackNavigator';
import { StylesProvider } from './StylesProvider';
import { useFormattersConfig } from './hooks/useFormattersConfig';
import { applicationInit } from './initActions';
import { useReportAppInitToAnalytics } from './hooks/useReportAppInitToAnalytics';
import { SentryProvider } from './SentryProvider';

// Base time to measure app loading time.
// The constant has to be placed at the beginning of this file to be initialized as soon as possible.
// TODO: This method of measuring app loading time is not ideal, Should be substituted by some more sophisticated solution in the future.
const APP_STARTED_TIMESTAMP = Date.now();

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

const AppComponent = () => {
    const dispatch = useDispatch();
    const formattersConfig = useFormattersConfig();
    const isAppReady = useSelector(selectIsAppReady);
    const isConnectInitialized = useSelector(selectIsConnectInitialized);
    useBiometrics();

    useReportAppInitToAnalytics(APP_STARTED_TIMESTAMP);

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
            <AlertRenderer>
                {/* Notifications are disabled until the problem with after-import notifications flooding is solved. */}
                {/* More here: https://github.com/trezor/trezor-suite/issues/7721  */}
                {/* <NotificationRenderer> */}
                <ToastRenderer>
                    <RootStackNavigator />
                </ToastRenderer>
                {/* </NotificationRenderer> */}
            </AlertRenderer>
        </FormatterProvider>
    );
};

const PureApp = () => (
    <GestureHandlerRootView style={{ flex: 1 }}>
        <IntlProvider locale="en" defaultLocale="en" messages={enMessages}>
            <StoreProvider>
                <SentryProvider>
                    <SafeAreaProvider>
                        <StylesProvider>
                            <NavigationContainerWithAnalytics>
                                <AppComponent />
                            </NavigationContainerWithAnalytics>
                        </StylesProvider>
                    </SafeAreaProvider>
                </SentryProvider>
            </StoreProvider>
        </IntlProvider>
    </GestureHandlerRootView>
);

export const App = Sentry.wrap(PureApp);

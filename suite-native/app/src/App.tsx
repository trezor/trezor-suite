import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';

import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import * as Sentry from '@sentry/react-native';
import * as SplashScreen from 'expo-splash-screen';

import { FormatterProvider } from '@suite-common/formatters';
import { OfflineBanner, configureNetInfo } from '@suite-native/connection-status';
import { IntlProvider } from '@suite-native/intl';
import { KillswitchMessageScreen, MessageSystemBannerRenderer } from '@suite-native/message-system';
import { NavigationContainerWithAnalytics } from '@suite-native/navigation';
import { StoreProvider, selectIsAppReady, selectIsConnectInitialized } from '@suite-native/state';

import { ModalsRenderer } from './ModalsRenderer';
import { SentryProvider } from './SentryProvider';
import { StylesProvider } from './StylesProvider';
import { useFormattersConfig } from './hooks/useFormattersConfig';
import { useReportAppInitToAnalytics } from './hooks/useReportAppInitToAnalytics';
import { applicationInit } from './initActions';
import { RootStackNavigator } from './navigation/RootStackNavigator';

if (__DEV__) {
    require('./LogBox');
}

// Base time to measure app loading time.
// The constant has to be placed at the beginning of this file to be initialized as soon as possible.
// TODO: This method of measuring app loading time is not ideal, Should be substituted by some more sophisticated solution in the future.
const APP_STARTED_TIMESTAMP = Date.now();

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

// Global configuration of NetInfo for network status monitoring.
// Calling this will stop all previously added listeners on NetInfo from being called again.
// https://github.com/react-native-netinfo/react-native-netinfo?tab=readme-ov-file#configure
configureNetInfo();

const AppComponent = () => {
    const dispatch = useDispatch();
    const formattersConfig = useFormattersConfig();
    const isAppReady = useSelector(selectIsAppReady);
    const isConnectInitialized = useSelector(selectIsConnectInitialized);

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

    if (!isAppReady) return null;

    return (
        <FormatterProvider config={formattersConfig}>
            <OfflineBanner />
            <MessageSystemBannerRenderer />
            <BottomSheetModalProvider>
                <RootStackNavigator />
            </BottomSheetModalProvider>
            <ModalsRenderer />
            {/* NOTE: Rendered as last item so that it covers the whole app screen */}
            <KillswitchMessageScreen />
        </FormatterProvider>
    );
};

const PureApp = () => (
    <GestureHandlerRootView style={{ flex: 1 }}>
        <IntlProvider>
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

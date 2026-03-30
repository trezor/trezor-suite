import { Activity, useEffect, useRef } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';

import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import * as Sentry from '@sentry/react-native';
import * as SplashScreen from 'expo-splash-screen';

import { FormatterProvider } from '@suite-common/formatters';
import { ReactNativeQueryProvider } from '@suite-common/react-query';
import { applicationInit } from '@suite-native/app-init';
import { useIsBiometricsOverlayVisible } from '@suite-native/biometrics';
import { configureNetInfo } from '@suite-native/connection-status';
import { useFormattersConfig } from '@suite-native/formatters-config';
import { IntlProvider } from '@suite-native/intl';
import { KillswitchMessageScreen } from '@suite-native/message-system';
import { NavigationContainerWithAnalytics } from '@suite-native/navigation';
import { initSentry } from '@suite-native/sentry';
import { StoreProvider, selectIsAppReady } from '@suite-native/state';

import { BannersRenderer } from './BannersRenderer';
import { ModalsRenderer } from './ModalsRenderer';
import { StylesProvider } from './StylesProvider';
import { InitRosenitePlugin } from './devtools/InitRoseniteDevTools';
import { useReportAppInitToAnalytics } from './hooks/useReportAppInitToAnalytics';
import { RootStackNavigator } from './navigation/RootStackNavigator';
import { disableRTL } from './rtl';

// Base time to measure app loading time.
// The constant has to be placed at the beginning of this file to be initialized as soon as possible.
// TODO: This method of measuring app loading time is not ideal, Should be substituted by some more sophisticated solution in the future.
const APP_STARTED_TIMESTAMP = Date.now();

if (__DEV__) {
    require('./LogBox');
}

initSentry();

// Right-to-left language support is not supported yet.
disableRTL();

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

// Global configuration of NetInfo for network status monitoring.
// Calling this will stop all previously added listeners on NetInfo from being called again.
// https://github.com/react-native-netinfo/react-native-netinfo?tab=readme-ov-file#configure
configureNetInfo();

const AppComponent = () => {
    const dispatch = useDispatch();
    const formattersConfig = useFormattersConfig();
    const isApplicationInitDispatchedRef = useRef(false);
    const isAppReady = useSelector(selectIsAppReady);
    const { isBiometricsOverlayVisible } = useIsBiometricsOverlayVisible();

    useReportAppInitToAnalytics(APP_STARTED_TIMESTAMP);

    useEffect(() => {
        if (!isApplicationInitDispatchedRef.current) {
            dispatch(applicationInit());
            isApplicationInitDispatchedRef.current = true;
        }
    }, [dispatch]);

    useEffect(() => {
        if (isAppReady) {
            SplashScreen.hideAsync();
        }
    }, [isAppReady]);

    if (!isAppReady) return null;

    return (
        <FormatterProvider config={formattersConfig}>
            {__DEV__ && <InitRosenitePlugin />}
            <BannersRenderer />
            <BottomSheetModalProvider>
                <Activity mode={isBiometricsOverlayVisible ? 'hidden' : 'visible'}>
                    <RootStackNavigator />
                </Activity>
            </BottomSheetModalProvider>
            <ModalsRenderer />
            {/* NOTE: Rendered as last item so that it covers the whole app screen */}
            <KillswitchMessageScreen />
        </FormatterProvider>
    );
};

const PureApp = () => (
    <GestureHandlerRootView style={{ flex: 1 }}>
        <StoreProvider>
            <ReactNativeQueryProvider>
                <IntlProvider>
                    <KeyboardProvider>
                        <SafeAreaProvider>
                            <StylesProvider>
                                <NavigationContainerWithAnalytics>
                                    <AppComponent />
                                </NavigationContainerWithAnalytics>
                            </StylesProvider>
                        </SafeAreaProvider>
                    </KeyboardProvider>
                </IntlProvider>
            </ReactNativeQueryProvider>
        </StoreProvider>
    </GestureHandlerRootView>
);

export const App = Sentry.wrap(PureApp);

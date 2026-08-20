import { useEffect, useRef } from 'react';
import { Freeze } from 'react-freeze';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';

import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import * as Sentry from '@sentry/react-native';
import * as SplashScreen from 'expo-splash-screen';

import { FormatterProvider } from '@suite-common/formatters';
import { ReactNativeQueryProvider } from '@suite-common/react-query/src/components/ReactNativeQueryProvider';
import { applicationInit } from '@suite-native/app-init';
import { selectShouldUserBeAuthenticated } from '@suite-native/biometrics';
import { launchArguments } from '@suite-native/config';
import { configureNetInfo } from '@suite-native/connection-status';
import { useFormattersConfig } from '@suite-native/formatters-config';
import { IntlProvider } from '@suite-native/intl';
import { KillswitchMessageScreen } from '@suite-native/message-system';
import { NavigationContainerWithAnalytics } from '@suite-native/navigation';
import {
    initSentry,
    markStartupJsBundleEvaluated,
    reportStartupAppLoaded,
} from '@suite-native/sentry';
import {
    type PreloadedState,
    StoreProvider,
    initStore,
    selectIsAppReady,
} from '@suite-native/state';

import { BannersRenderer } from './BannersRenderer';
import { ModalsRenderer } from './ModalsRenderer';
import { StylesProvider } from './StylesProvider';
import { InitRosenitePlugin } from './devtools/InitRoseniteDevTools';
import { useReportAppInitToAnalytics } from './hooks/useReportAppInitToAnalytics';
import { RootStackNavigator } from './navigation/RootStackNavigator';
import { disableRTL } from './rtl';

markStartupJsBundleEvaluated();

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

// preloadedState has to be cast to PreloadedState type because it is passed from Detox as `string` (serialized object)
// but the `react-native-launch-arguments` library does converts it to JavaScript object in the background.
const store = initStore(launchArguments.preloadedState as PreloadedState);

const AppComponent = () => {
    const dispatch = useDispatch();
    const formattersConfig = useFormattersConfig();
    const isApplicationInitDispatchedRef = useRef(false);
    const isAppReady = useSelector(selectIsAppReady);
    const shouldUserBeAuthenticated = useSelector(selectShouldUserBeAuthenticated);

    useReportAppInitToAnalytics();

    useEffect(() => {
        if (!isApplicationInitDispatchedRef.current) {
            dispatch(applicationInit());
            isApplicationInitDispatchedRef.current = true;
        }
    }, [dispatch]);

    useEffect(() => {
        if (isAppReady) {
            // Report the first usable frame even if the native splash API fails to resolve.
            void SplashScreen.hideAsync().then(reportStartupAppLoaded, reportStartupAppLoaded);
        }
    }, [isAppReady]);

    if (!isAppReady) return null;

    return (
        <FormatterProvider config={formattersConfig}>
            {__DEV__ && <InitRosenitePlugin />}
            <BannersRenderer />
            <BottomSheetModalProvider>
                <Freeze freeze={shouldUserBeAuthenticated}>
                    <RootStackNavigator />
                </Freeze>
            </BottomSheetModalProvider>
            <ModalsRenderer />
            {/* NOTE: Rendered as last item so that it covers the whole app screen */}
            <KillswitchMessageScreen />
        </FormatterProvider>
    );
};

const PureApp = () => (
    <GestureHandlerRootView style={{ flex: 1 }}>
        <StoreProvider store={store}>
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

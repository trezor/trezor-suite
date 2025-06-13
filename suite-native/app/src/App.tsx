import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';

import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import * as Sentry from '@sentry/react-native';
import * as SplashScreen from 'expo-splash-screen';

import { FormatterProvider } from '@suite-common/formatters';
import { configureNetInfo } from '@suite-native/connection-status';
import { useFormattersConfig } from '@suite-native/formatters';
import { IntlProvider } from '@suite-native/intl';
import { KillswitchMessageScreen } from '@suite-native/message-system';
import { NavigationContainerWithAnalytics } from '@suite-native/navigation';
import { initSentry } from '@suite-native/sentry';
import { selectIsOnboardingFinished } from '@suite-native/settings';
import { StoreProvider, selectIsAppReady } from '@suite-native/state';

import { BannersRenderer } from './BannersRenderer';
import { ModalsRenderer } from './ModalsRenderer';
import { StylesProvider } from './StylesProvider';
import { useReportAppInitToAnalytics } from './hooks/useReportAppInitToAnalytics';
import { applicationInit, postOnboardingInit } from './initActions';
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

let isApplicationInitDispatched = false;
let isPostOnboardingInitDispatched = false;

const AppComponent = () => {
    const dispatch = useDispatch();
    const formattersConfig = useFormattersConfig();
    const isAppReady = useSelector(selectIsAppReady);
    const isOnboardingFinished = useSelector(selectIsOnboardingFinished);

    useReportAppInitToAnalytics(APP_STARTED_TIMESTAMP);

    useEffect(() => {
        if (!isApplicationInitDispatched) {
            dispatch(applicationInit());
            isApplicationInitDispatched = true;
        }
    }, [dispatch]);

    useEffect(() => {
        if (isAppReady) {
            SplashScreen.hideAsync();
        }
    }, [isAppReady]);

    useEffect(() => {
        if (isAppReady && isOnboardingFinished && !isPostOnboardingInitDispatched) {
            dispatch(postOnboardingInit());
            isPostOnboardingInitDispatched = true;
        }
    }, [isAppReady, isOnboardingFinished, dispatch]);

    if (!isAppReady) return null;

    return (
        <FormatterProvider config={formattersConfig}>
            <BannersRenderer />
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
                <KeyboardProvider>
                    <SafeAreaProvider>
                        <StylesProvider>
                            <NavigationContainerWithAnalytics>
                                <AppComponent />
                            </NavigationContainerWithAnalytics>
                        </StylesProvider>
                    </SafeAreaProvider>
                </KeyboardProvider>
            </StoreProvider>
        </IntlProvider>
    </GestureHandlerRootView>
);

export const App = Sentry.wrap(PureApp);

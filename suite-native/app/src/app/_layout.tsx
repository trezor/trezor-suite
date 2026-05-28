/* eslint-disable import/no-default-export */
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
import { useIsBiometricsOverlayVisible } from '@suite-native/biometrics';
import { configureNetInfo } from '@suite-native/connection-status';
import { useFormattersConfig } from '@suite-native/formatters-config';
import { IntlProvider } from '@suite-native/intl';
import { KillswitchMessageScreen } from '@suite-native/message-system';
import { ExpoRouterNavigationBridge, NavigationThemeProvider } from '@suite-native/navigation';
import { initSentry } from '@suite-native/sentry';
import { StoreProvider, selectIsAppReady } from '@suite-native/state';

import { BannersRenderer } from '../BannersRenderer';
import { ModalsRenderer } from '../ModalsRenderer';
import { StylesProvider } from '../StylesProvider';
import { InitRosenitePlugin } from '../devtools/InitRoseniteDevTools';
import { useReportAppInitToAnalytics } from '../hooks/useReportAppInitToAnalytics';
import { disableRTL } from '../rtl';
import { RootStack } from './RootStack';

const APP_STARTED_TIMESTAMP = Date.now();

if (__DEV__) {
    require('../LogBox');
}

initSentry();

disableRTL();

SplashScreen.preventAutoHideAsync();

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

    return (
        <FormatterProvider config={formattersConfig}>
            {isAppReady && __DEV__ && <InitRosenitePlugin />}
            {isAppReady && <BannersRenderer />}
            <BottomSheetModalProvider>
                <Freeze freeze={isBiometricsOverlayVisible}>
                    <RootStack />
                </Freeze>
            </BottomSheetModalProvider>
            {isAppReady && <ModalsRenderer />}
            {isAppReady && <KillswitchMessageScreen />}
        </FormatterProvider>
    );
};

const PureRootLayout = () => (
    <GestureHandlerRootView style={{ flex: 1 }}>
        <StoreProvider>
            <ReactNativeQueryProvider>
                <IntlProvider>
                    <KeyboardProvider>
                        <SafeAreaProvider>
                            <StylesProvider>
                                <NavigationThemeProvider>
                                    <ExpoRouterNavigationBridge>
                                        <AppComponent />
                                    </ExpoRouterNavigationBridge>
                                </NavigationThemeProvider>
                            </StylesProvider>
                        </SafeAreaProvider>
                    </KeyboardProvider>
                </IntlProvider>
            </ReactNativeQueryProvider>
        </StoreProvider>
    </GestureHandlerRootView>
);

export default Sentry.wrap(PureRootLayout);

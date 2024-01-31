import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';

import * as SplashScreen from 'expo-splash-screen';
import * as Sentry from '@sentry/react-native';

import TrezorConnect from '@trezor/connect';
import { selectIsAppReady, selectIsConnectInitialized, StoreProvider } from '@suite-native/state';
import { FormatterProvider } from '@suite-common/formatters';
import { NavigationContainerWithAnalytics } from '@suite-native/navigation';
import { FeatureMessageScreen, MessageSystemBannerRenderer } from '@suite-native/message-system';
import { IntlProvider } from '@suite-native/intl';
import { useTransactionCache } from '@suite-native/accounts';
import { isDebugEnv } from '@suite-native/config';

import { RootStackNavigator } from './navigation/RootStackNavigator';
import { StylesProvider } from './StylesProvider';
import { useFormattersConfig } from './hooks/useFormattersConfig';
import { applicationInit } from './initActions';
import { useReportAppInitToAnalytics } from './hooks/useReportAppInitToAnalytics';
import { SentryProvider } from './SentryProvider';
import { ModalsRenderer } from './ModalsRenderer';

// Base time to measure app loading time.
// The constant has to be placed at the beginning of this file to be initialized as soon as possible.
// TODO: This method of measuring app loading time is not ideal, Should be substituted by some more sophisticated solution in the future.
const APP_STARTED_TIMESTAMP = Date.now();

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

// NOTE: This is a workaround wrapper for connect methods to prevent sending useEmptyPassphrase as undefined until we will implement passphrase behavior in mobile.
type ConnectKey = keyof typeof TrezorConnect;
const wrappedMethods = [
    'getAccountInfo',
    'blockchainEstimateFee',
    'blockchainSetCustomBackend',
    'blockchainSubscribeFiatRates',
    'blockchainGetCurrentFiatRates',
    'blockchainSubscribe',
    'blockchainUnsubscribe',
    'cardanoGetPublicKey',
    'getDeviceState',
    'cardanoGetAddress',
    'getAddress',
    'rippleGetAddress',
    'ethereumGetAddress',
    'solanaGetAddress',
    'blockchainGetFiatRatesForTimestamps',
    'getAccountDescriptor',
    'blockchainGetAccountBalanceHistory',
    'blockchainUnsubscribeFiatRates',
];

wrappedMethods.forEach(key => {
    const original: any = TrezorConnect[key as ConnectKey];
    if (!original) return;
    (TrezorConnect[key as ConnectKey] as any) = async (params: any) => {
        const result = await original({
            ...params,
            useEmptyPassphrase: true,
        });
        return result;
    };
});

const AppComponent = () => {
    const dispatch = useDispatch();
    const formattersConfig = useFormattersConfig();
    const isAppReady = useSelector(selectIsAppReady);
    const isConnectInitialized = useSelector(selectIsConnectInitialized);

    useReportAppInitToAnalytics(APP_STARTED_TIMESTAMP);
    useTransactionCache();

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
            <MessageSystemBannerRenderer />
            <RootStackNavigator />
            <ModalsRenderer />
            {/* NOTE: Rendered as last item so that it covers the whole app screen */}
            <FeatureMessageScreen />
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

export const App = isDebugEnv() ? PureApp : Sentry.wrap(PureApp);

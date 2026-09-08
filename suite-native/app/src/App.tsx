import { useEffect } from 'react';
import { Freeze } from 'react-freeze';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';

import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import * as SplashScreen from 'expo-splash-screen';

import { FormatterProvider } from '@suite-common/formatters';
import { ReactNativeQueryProvider } from '@suite-common/react-query/src/components/ReactNativeQueryProvider';
import { selectShouldUserBeAuthenticated } from '@suite-native/biometrics';
import { useFormattersConfig } from '@suite-native/formatters-config';
import { IntlProvider } from '@suite-native/intl';
import { KillswitchMessageScreen } from '@suite-native/message-system';
import { NavigationContainerWithAnalytics } from '@suite-native/navigation';
import { reportStartupAppLoaded } from '@suite-native/sentry';
import {
    type NativeReduxStoreDep,
    type NativeServices,
    type StorePersistorDep,
    StoreProvider,
    selectIsAppReady,
} from '@suite-native/state';

import { BannersRenderer } from './BannersRenderer';
import { ModalsRenderer } from './ModalsRenderer';
import { StylesProvider } from './StylesProvider';
import { InitRosenitePlugin } from './devtools/InitRoseniteDevTools';
import { useReportAppInitToAnalytics } from './hooks/useReportAppInitToAnalytics';
import { RootStackNavigator } from './navigation/RootStackNavigator';

const AppComponent = () => {
    const formattersConfig = useFormattersConfig();
    const isAppReady = useSelector(selectIsAppReady);
    const shouldUserBeAuthenticated = useSelector(selectShouldUserBeAuthenticated);

    useReportAppInitToAnalytics();

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

type PureAppProps = {
    services: NativeServices & NativeReduxStoreDep & StorePersistorDep;
};

export const PureApp = ({ services }: PureAppProps) => (
    <GestureHandlerRootView style={{ flex: 1 }}>
        <StoreProvider services={services}>
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

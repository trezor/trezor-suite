/* eslint-disable import/no-default-export */
import { type ReactNode, useCallback, useEffect, useRef, useState } from 'react';
import { Freeze } from 'react-freeze';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';

import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import * as Sentry from '@sentry/react-native';
import { Stack, useNavigationContainerRef } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';

import { useServices } from '@suite-common/dependency-injection';
import { FormatterProvider } from '@suite-common/formatters';
import { ReactNativeQueryProvider } from '@suite-common/react-query/src/components/ReactNativeQueryProvider';
import { type NativeAnalyticsDep, events } from '@suite-native/analytics';
import { applicationInit } from '@suite-native/app-init';
import { useIsBiometricsOverlayVisible } from '@suite-native/biometrics';
import { isDevelopOrDebugEnv } from '@suite-native/config';
import { configureNetInfo } from '@suite-native/connection-status';
import { useFormattersConfig } from '@suite-native/formatters-config';
import { IntlProvider } from '@suite-native/intl';
import { KillswitchMessageScreen } from '@suite-native/message-system';
import {
    IsNavigationReadyContext,
    NavigationThemeProvider,
    RootStackRoutes,
    stackNavigationOptionsConfig,
    useNavigationDevTools,
    useReportSendFlowExitToAnalytics,
} from '@suite-native/navigation';
import { addSentryBreadcrumb, initSentry, setSentryTag } from '@suite-native/sentry';
import { StoreProvider, selectIsAppReady } from '@suite-native/state';

import { BannersRenderer } from '../BannersRenderer';
import { ModalsRenderer } from '../ModalsRenderer';
import { StylesProvider } from '../StylesProvider';
import { InitRosenitePlugin } from '../devtools/InitRoseniteDevTools';
import { useReportAppInitToAnalytics } from '../hooks/useReportAppInitToAnalytics';
import { NavigatorLayoutWithGlobalHooks } from '../navigation/RootStackNavigatorGlobalHooksWrapper';
import { disableRTL } from '../rtl';

const APP_STARTED_TIMESTAMP = Date.now();

const slideFromBottomOptions = {
    animation: 'slide_from_bottom',
} as const;

if (__DEV__) {
    require('../LogBox');
}

initSentry();

disableRTL();

SplashScreen.preventAutoHideAsync();

configureNetInfo();

const ExpoRouterNavigationBridge = ({ children }: { children: ReactNode }) => {
    const [isNavigationReady, setIsNavigationReady] = useState(false);
    const routeNameRef = useRef<string | undefined>(undefined);
    const navigationRef = useNavigationContainerRef();
    const { analytics } = useServices<NativeAnalyticsDep>();
    const reportSendFlowExitToAnalytics = useReportSendFlowExitToAnalytics();

    useNavigationDevTools({ ref: navigationRef });

    const handleNavigationReady = useCallback(() => {
        if (!navigationRef.isReady()) return;

        routeNameRef.current = navigationRef.getCurrentRoute()?.name;
        setIsNavigationReady(true);
    }, [navigationRef]);

    const handleNavigationStateChange = useCallback(() => {
        if (!navigationRef.isReady()) return;

        setIsNavigationReady(true);

        const previousRouteName = routeNameRef.current;
        const currentRouteName = navigationRef.getCurrentRoute()?.name;

        if (!currentRouteName) return;

        if (!previousRouteName) {
            routeNameRef.current = currentRouteName;

            return;
        }

        reportSendFlowExitToAnalytics(currentRouteName);

        if (previousRouteName !== currentRouteName) {
            routeNameRef.current = currentRouteName;

            analytics.report({
                type: events.screenChangeEvent.name,
                payload: {
                    previousScreen: previousRouteName,
                    currentScreen: currentRouteName,
                },
            });

            addSentryBreadcrumb({
                category: events.screenChangeEvent.name,
                message: 'screen changed',
                level: 'info',
                data: {
                    previousScreen: previousRouteName,
                    currentScreen: currentRouteName,
                },
            });

            setSentryTag('route', currentRouteName);
        }
    }, [analytics, navigationRef, reportSendFlowExitToAnalytics]);

    useEffect(() => {
        handleNavigationReady();
        handleNavigationStateChange();

        const unsubscribeReadyListener = navigationRef.addListener('ready', handleNavigationReady);
        const unsubscribeStateListener = navigationRef.addListener(
            'state',
            handleNavigationStateChange,
        );

        return () => {
            unsubscribeReadyListener();
            unsubscribeStateListener();
        };
    }, [handleNavigationReady, handleNavigationStateChange, navigationRef]);

    return (
        <IsNavigationReadyContext.Provider value={isNavigationReady}>
            {children}
        </IsNavigationReadyContext.Provider>
    );
};

const RootStack = () => {
    const isStorybookEnabled = isDevelopOrDebugEnv();

    return (
        <Stack
            layout={NavigatorLayoutWithGlobalHooks}
            initialRouteName="index"
            screenOptions={stackNavigationOptionsConfig}
        >
            <Stack.Screen name="index" />
            <Stack.Screen name={RootStackRoutes.OnboardingStack} />
            <Stack.Screen name={RootStackRoutes.AppTabs} />
            <Stack.Screen
                options={{ title: RootStackRoutes.AccountSettings }}
                name={RootStackRoutes.AccountSettings}
            />
            <Stack.Screen name={RootStackRoutes.TransactionDetailStack} />
            <Stack.Screen
                options={{ title: RootStackRoutes.AccountAssets }}
                name={RootStackRoutes.AccountAssets}
            />
            <Stack.Screen
                options={{ title: RootStackRoutes.AccountDetail }}
                name={RootStackRoutes.AccountDetail}
            />
            <Stack.Screen
                options={{ title: RootStackRoutes.StakingDetail }}
                name={RootStackRoutes.StakingDetail}
            />
            <Stack.Screen
                options={{ title: RootStackRoutes.StakingManagement }}
                name={RootStackRoutes.StakingManagement}
            />
            <Stack.Screen
                options={{ title: RootStackRoutes.StakingInsufficientBalance }}
                name={RootStackRoutes.StakingInsufficientBalance}
            />
            <Stack.Screen
                options={{ title: RootStackRoutes.UnstakeFlow }}
                name={RootStackRoutes.UnstakeFlow}
            />
            <Stack.Screen
                options={{ title: RootStackRoutes.HowStakeWorksScreen }}
                name={RootStackRoutes.HowStakeWorksScreen}
            />
            <Stack.Screen
                options={{ title: RootStackRoutes.YieldNavigator }}
                name={RootStackRoutes.YieldNavigator}
            />
            <Stack.Screen
                options={{ title: RootStackRoutes.EarnForm }}
                name={RootStackRoutes.EarnForm}
            />
            <Stack.Screen
                options={{ title: RootStackRoutes.EarnConsents }}
                name={RootStackRoutes.EarnConsents}
            />
            <Stack.Screen
                options={{ title: RootStackRoutes.EarnTransactionDataReview }}
                name={RootStackRoutes.EarnTransactionDataReview}
            />
            <Stack.Screen
                options={{ title: RootStackRoutes.UnstakeTransactionDataReview }}
                name={RootStackRoutes.UnstakeTransactionDataReview}
            />
            <Stack.Screen
                options={{ title: RootStackRoutes.ClaimReview }}
                name={RootStackRoutes.ClaimReview}
            />
            <Stack.Screen
                options={{ title: RootStackRoutes.ClaimTransactionDataReview }}
                name={RootStackRoutes.ClaimTransactionDataReview}
            />
            <Stack.Screen
                options={{ title: RootStackRoutes.TradingExchangePreview }}
                name={RootStackRoutes.TradingExchangePreview}
            />
            <Stack.Screen
                options={{ title: RootStackRoutes.TradingExchangeApproval }}
                name={RootStackRoutes.TradingExchangeApproval}
            />
            <Stack.Screen
                options={{ title: RootStackRoutes.TradingExchangeRevoke }}
                name={RootStackRoutes.TradingExchangeRevoke}
            />
            <Stack.Screen
                options={{ title: RootStackRoutes.TradingSellPreview }}
                name={RootStackRoutes.TradingSellPreview}
            />
            <Stack.Screen
                options={{ title: RootStackRoutes.TradingConfirming }}
                name={RootStackRoutes.TradingConfirming}
            />
            <Stack.Screen
                options={{ title: RootStackRoutes.TradingSellOutputsReview }}
                name={RootStackRoutes.TradingSellOutputsReview}
            />
            <Stack.Screen
                options={{ title: RootStackRoutes.TradingExchangeOutputsReview }}
                name={RootStackRoutes.TradingExchangeOutputsReview}
            />
            <Stack.Screen
                options={{ title: RootStackRoutes.ReceiveAccounts }}
                name={RootStackRoutes.ReceiveAccounts}
            />
            <Stack.Screen
                options={{ title: RootStackRoutes.TradingHistory }}
                name={RootStackRoutes.TradingHistory}
            />
            <Stack.Screen name={RootStackRoutes.DevUtils} />
            <Stack.Screen name={RootStackRoutes.ConnectPopup} />
            <Stack.Screen name={RootStackRoutes.WalletConnectSessionPopup} />
            <Stack.Screen name={RootStackRoutes.WalletConnectSwitchAccount} />
            <Stack.Screen name={RootStackRoutes.WalletConnectPair} />
            <Stack.Screen name={RootStackRoutes.ConnectPermissions} />
            <Stack.Screen name={RootStackRoutes.SettingsScreenStack} />
            <Stack.Screen name={RootStackRoutes.DemoAccountQuestionnaireStack} />
            <Stack.Screen name={RootStackRoutes.DeviceCompromisedModal} />
            <Stack.Screen name={RootStackRoutes.BackupFailedModal} />
            <Stack.Screen name={RootStackRoutes.BootloaderMode} />
            <Stack.Screen
                name={RootStackRoutes.DeviceOnboardingStack}
                options={slideFromBottomOptions}
            />
            <Stack.Screen name={RootStackRoutes.AccountsImport} options={slideFromBottomOptions} />
            <Stack.Screen
                name={RootStackRoutes.AddCoinAccountStack}
                options={slideFromBottomOptions}
            />
            <Stack.Screen name={RootStackRoutes.ReceiveStack} options={slideFromBottomOptions} />
            <Stack.Screen name={RootStackRoutes.SendStack} options={slideFromBottomOptions} />
            <Stack.Screen
                name={RootStackRoutes.DeviceSettingsStack}
                options={slideFromBottomOptions}
            />
            <Stack.Screen
                name={RootStackRoutes.AuthorizeDeviceStack}
                options={{ ...slideFromBottomOptions, gestureEnabled: false }}
            />
            <Stack.Screen
                name={RootStackRoutes.PassphraseStack}
                options={{ ...slideFromBottomOptions, gestureEnabled: false }}
            />
            <Stack.Screen
                name={RootStackRoutes.TradingLocationModal}
                options={slideFromBottomOptions}
            />
            <Stack.Screen
                name={RootStackRoutes.StellarManageTokenStack}
                options={slideFromBottomOptions}
            />
            <Stack.Screen
                name={RootStackRoutes.FeatureFeedbackModal}
                options={slideFromBottomOptions}
            />
            <Stack.Screen
                name={RootStackRoutes.Storybook}
                redirect={!isStorybookEnabled}
                options={{
                    ...slideFromBottomOptions,
                    headerShown: true,
                    headerBackButtonDisplayMode: 'minimal',
                }}
            />
        </Stack>
    );
};

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

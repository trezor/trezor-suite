import { type ReactNode, createContext, useContext, useMemo, useRef, useState } from 'react';

import {
    DarkTheme,
    DefaultTheme,
    NavigationContainer,
    createNavigationContainerRef,
    useRoute,
} from '@react-navigation/native';
import { useReactNavigationDevTools } from '@rozenite/react-navigation-plugin';

import { events, injectNativeAnalytics } from '@suite-native/analytics';
import {
    addSentryBreadcrumb,
    registerSentryNavigationContainer,
    setSentryTag,
} from '@suite-native/sentry';
import { useServices } from '@trezor/dependency-injection';
import { useNativeStyles } from '@trezor/styles-native';

import { useReportEarnEntryToAnalytics } from '../hooks/useReportEarnEntryToAnalytics';
import { useReportSendFlowExitToAnalytics } from '../hooks/useReportSendFlowExitToAnalytics';
import { type RootStackParamList } from '../navigators';

export const IsNavigationReadyContext = createContext(false);
type EarnEntry = { id: number; routeKey?: string };
const EarnEntryContext = createContext<EarnEntry>({ id: 0 });
export const useEarnEntryId = () => {
    const entry = useContext(EarnEntryContext);
    const route = useRoute();

    return entry.routeKey === route.key ? entry.id : 0;
};

export const navigationContainerRef = createNavigationContainerRef<RootStackParamList>();

export const NavigationContainerWithAnalytics = ({ children }: { children: ReactNode }) => {
    const [isNavigationReady, setIsNavigationReady] = useState(false);
    const [earnEntry, setEarnEntry] = useState<EarnEntry>({ id: 0 });
    const routeNameRef = useRef<string | undefined>(undefined);
    const { analytics } = useServices(injectNativeAnalytics);
    const {
        utils: { colors, isDarkColor },
    } = useNativeStyles();
    const reportSendFlowExitToAnalytics = useReportSendFlowExitToAnalytics();
    const reportEarnEntry = useReportEarnEntryToAnalytics();

    // Enable React Navigation DevTools in development
    useReactNavigationDevTools({ ref: navigationContainerRef });

    const themeColors = useMemo(() => {
        // setting theme colors to match the background color of the screen to prevent white flash on screen change in dark mode
        const isDarkTheme = isDarkColor(colors.surfaceFillPage);
        if (isDarkTheme) {
            return {
                ...DarkTheme,
                colors: {
                    ...DarkTheme.colors,
                    background: colors.surfaceFillPage,
                },
            };
        }

        return {
            ...DefaultTheme,
            colors: {
                ...DefaultTheme.colors,
                background: colors.surfaceFillPage,
            },
        };
    }, [colors, isDarkColor]);

    const handleNavigationReady = () => {
        registerSentryNavigationContainer(navigationContainerRef);
        const route = navigationContainerRef.getCurrentRoute();
        routeNameRef.current = route?.name;
        if (reportEarnEntry({ currentRouteName: route?.name, currentRouteKey: route?.key })) {
            setEarnEntry(entry => ({ id: entry.id + 1, routeKey: route?.key }));
        }
        if (!isNavigationReady) setIsNavigationReady(true);
    };

    const handleStateChange = () => {
        if (!navigationContainerRef.isReady()) return;

        const previousRouteName = routeNameRef.current;
        const route = navigationContainerRef.getCurrentRoute();
        const currentRouteName = route?.name;
        if (reportEarnEntry({ currentRouteName, currentRouteKey: route?.key, previousRouteName })) {
            setEarnEntry(entry => ({ id: entry.id + 1, routeKey: route?.key }));
        }

        // If the user abandons the send flow, this function reports from which step.
        reportSendFlowExitToAnalytics(currentRouteName);

        if (previousRouteName !== currentRouteName) {
            // Save the current route name for later comparison
            routeNameRef.current = currentRouteName;

            if (!currentRouteName || !previousRouteName) return;

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
    };

    return (
        <IsNavigationReadyContext.Provider value={isNavigationReady}>
            <EarnEntryContext.Provider value={earnEntry}>
                <NavigationContainer
                    ref={navigationContainerRef}
                    onReady={handleNavigationReady}
                    onStateChange={handleStateChange}
                    theme={themeColors}
                >
                    {children}
                </NavigationContainer>
            </EarnEntryContext.Provider>
        </IsNavigationReadyContext.Provider>
    );
};

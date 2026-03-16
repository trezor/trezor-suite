import { type ReactNode, createContext, useMemo, useRef, useState } from 'react';

import {
    DarkTheme,
    DefaultTheme,
    NavigationContainer,
    createNavigationContainerRef,
} from '@react-navigation/native';
import { useReactNavigationDevTools } from '@rozenite/react-navigation-plugin';

import { events } from '@suite-native/analytics';
import { addSentryBreadcrumb, setSentryTag } from '@suite-native/sentry';
import { useAnalytics } from '@suite-native/services';
import { useNativeStyles } from '@trezor/styles';

import { useReportSendFlowExitToAnalytics } from '../hooks/useReportSendFlowExitToAnalytics';
import { type RootStackParamList } from '../navigators';

export const IsNavigationReadyContext = createContext(false);

export const navigationContainerRef = createNavigationContainerRef<RootStackParamList>();

export const NavigationContainerWithAnalytics = ({ children }: { children: ReactNode }) => {
    const [isNavigationReady, setIsNavigationReady] = useState(false);
    const routeNameRef = useRef<string | undefined>(undefined);
    const analytics = useAnalytics();
    const {
        utils: { colors, isDarkColor },
    } = useNativeStyles();
    const reportSendFlowExitToAnalytics = useReportSendFlowExitToAnalytics();

    // Enable React Navigation DevTools in development
    useReactNavigationDevTools({ ref: navigationContainerRef });

    const themeColors = useMemo(() => {
        // setting theme colors to match the background color of the screen to prevent white flash on screen change in dark mode
        const isDarkTheme = isDarkColor(colors.backgroundSurfaceElevation0);
        if (isDarkTheme) {
            return {
                ...DarkTheme,
                colors: {
                    ...DarkTheme.colors,
                    background: colors.backgroundSurfaceElevation0,
                },
            };
        }

        return {
            ...DefaultTheme,
            colors: {
                ...DefaultTheme.colors,
                background: colors.backgroundSurfaceElevation0,
            },
        };
    }, [colors, isDarkColor]);

    const handleNavigationReady = () => {
        routeNameRef.current = navigationContainerRef.getCurrentRoute()?.name;
        if (!isNavigationReady) setIsNavigationReady(true);
    };

    const handleStateChange = () => {
        if (!navigationContainerRef.isReady()) return;

        const previousRouteName = routeNameRef.current;
        const currentRouteName = navigationContainerRef.getCurrentRoute()?.name;

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
            <NavigationContainer
                ref={navigationContainerRef}
                onReady={handleNavigationReady}
                onStateChange={handleStateChange}
                theme={themeColors}
            >
                {children}
            </NavigationContainer>
        </IsNavigationReadyContext.Provider>
    );
};

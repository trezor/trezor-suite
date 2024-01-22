import { useMemo, useRef, ReactNode } from 'react';

import * as Sentry from '@sentry/react-native';
import {
    NavigationContainer,
    useNavigationContainerRef,
    DefaultTheme,
    DarkTheme,
} from '@react-navigation/native';

import { analytics, EventType } from '@suite-native/analytics';
import { useNativeStyles } from '@trezor/styles';

export const NavigationContainerWithAnalytics = ({ children }: { children: ReactNode }) => {
    const navigationContainerRef = useNavigationContainerRef();
    const routeNameRef = useRef<string | undefined>();
    const {
        utils: { colors, isDarkColor },
    } = useNativeStyles();

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
    };

    const handleStateChange = () => {
        const previousRouteName = routeNameRef.current;
        const currentRouteName = navigationContainerRef.getCurrentRoute()?.name;

        if (previousRouteName !== currentRouteName) {
            // Save the current route name for later comparison
            routeNameRef.current = currentRouteName;

            if (!currentRouteName || !previousRouteName) return;

            analytics.report({
                type: EventType.ScreenChange,
                payload: {
                    previousScreen: previousRouteName,
                    currentScreen: currentRouteName,
                },
            });

            Sentry.addBreadcrumb({
                category: EventType.ScreenChange,
                message: 'screen changed',
                level: 'info',
                data: {
                    previousScreen: previousRouteName,
                    currentScreen: currentRouteName,
                },
            });

            Sentry.setTag('route', currentRouteName);
        }
    };

    return (
        <NavigationContainer
            ref={navigationContainerRef}
            onReady={handleNavigationReady}
            onStateChange={handleStateChange}
            theme={themeColors}
        >
            {children}
        </NavigationContainer>
    );
};

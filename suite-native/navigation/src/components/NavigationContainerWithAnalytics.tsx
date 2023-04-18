import React, { ReactNode, useRef } from 'react';

import { NavigationContainer, useNavigationContainerRef } from '@react-navigation/native';

import { analytics, EventType } from '@suite-native/analytics';

export const NavigationContainerWithAnalytics = ({ children }: { children: ReactNode }) => {
    const navigationContainerRef = useNavigationContainerRef();
    const routeNameRef = useRef<string | undefined>();

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
        }
    };

    return (
        <NavigationContainer
            ref={navigationContainerRef}
            onReady={handleNavigationReady}
            onStateChange={handleStateChange}
        >
            {children}
        </NavigationContainer>
    );
};

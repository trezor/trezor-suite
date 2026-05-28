import { type ReactNode, useCallback, useEffect, useRef, useState } from 'react';

import { useNavigationContainerRef } from 'expo-router';

import { useServices } from '@suite-common/dependency-injection';
import { events, selectNativeAnalyticsDep } from '@suite-native/analytics';
import { addSentryBreadcrumb, setSentryTag } from '@suite-native/sentry';

import {
    IsNavigationReadyContext,
    useNavigationDevTools,
} from './NavigationContainerWithAnalytics';
import { useReportSendFlowExitToAnalytics } from '../hooks/useReportSendFlowExitToAnalytics';

/*
Tracks the active route name as it changes inside expo-router and reports analytics + sentry
breadcrumbs for screen changes. Also exposes IsNavigationReadyContext so descendants can defer
side effects until the navigator has mounted.
 */
export const ExpoRouterNavigationBridge = ({ children }: { children: ReactNode }) => {
    const [isNavigationReady, setIsNavigationReady] = useState(false);
    const routeNameRef = useRef<string | undefined>(undefined);
    const navigationRef = useNavigationContainerRef();
    const { analytics } = useServices(selectNativeAnalyticsDep);
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

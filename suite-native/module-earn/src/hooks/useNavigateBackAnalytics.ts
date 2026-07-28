import { useCallback, useRef } from 'react';

import { useFocusEffect } from '@react-navigation/native';

import { useServices } from '@suite-common/dependency-injection';
import { type AnalyticsNativeEvents, selectNativeAnalyticsDep } from '@suite-native/analytics';
import { useNavigationRemoveActionInterceptor } from '@suite-native/navigation';

export const useNavigateBackAnalytics = (event: AnalyticsNativeEvents) => {
    const { analytics } = useServices(selectNativeAnalyticsDep);
    const hasContinuedRef = useRef(false);
    const eventRef = useRef(event);
    eventRef.current = event;

    useFocusEffect(
        useCallback(() => {
            hasContinuedRef.current = false;
        }, []),
    );

    useNavigationRemoveActionInterceptor({
        actionTypesToIntercept: [],
        onPassThroughAction: action => {
            if ((action.type === 'GO_BACK' || action.type === 'POP') && !hasContinuedRef.current) {
                analytics.report(eventRef.current);
            }
        },
    });

    return useCallback(() => {
        hasContinuedRef.current = true;
    }, []);
};

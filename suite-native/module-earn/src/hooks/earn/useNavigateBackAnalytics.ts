import { useCallback, useRef } from 'react';

import { useFocusEffect } from '@react-navigation/native';

import { type AnalyticsNativeEvents, injectNativeAnalytics } from '@suite-native/analytics';
import { BACK_NAVIGATION_ACTIONS, useOnNavigationRemove } from '@suite-native/navigation';
import { useServices } from '@trezor/dependency-injection';

export const useNavigateBackAnalytics = (event: AnalyticsNativeEvents) => {
    const { analytics } = useServices(injectNativeAnalytics);
    const hasContinuedRef = useRef(false);
    const eventRef = useRef(event);
    eventRef.current = event;

    useFocusEffect(
        useCallback(() => {
            hasContinuedRef.current = false;
        }, []),
    );

    useOnNavigationRemove({
        actionTypes: BACK_NAVIGATION_ACTIONS,
        onRemoveAttempt: () => {
            if (!hasContinuedRef.current) {
                analytics.report(eventRef.current);
            }
        },
    });

    return useCallback(() => {
        hasContinuedRef.current = true;
    }, []);
};

import { useCallback, useRef } from 'react';

import { useFocusEffect } from '@react-navigation/native';

import { type AnalyticsNativeEvents, injectNativeAnalytics } from '@suite-native/analytics';
import { BACK_NAVIGATION_ACTIONS, useOnNavigationRemove } from '@suite-native/navigation';
import { useServices } from '@trezor/dependency-injection';

const ACTION_TYPES = [...BACK_NAVIGATION_ACTIONS, 'POP_TO_TOP'];

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
        actionTypes: ACTION_TYPES,
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

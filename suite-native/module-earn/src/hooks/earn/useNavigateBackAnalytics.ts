import { useCallback, useEffect, useRef } from 'react';

import { useFocusEffect, useNavigation } from '@react-navigation/native';

import { useServices } from '@suite-common/dependency-injection';
import { type AnalyticsNativeEvents, selectNativeAnalyticsDep } from '@suite-native/analytics';

export const useNavigateBackAnalytics = (event: AnalyticsNativeEvents) => {
    const { analytics } = useServices(selectNativeAnalyticsDep);
    const hasContinuedRef = useRef(false);
    const navigation = useNavigation();
    const eventRef = useRef(event);
    eventRef.current = event;

    useFocusEffect(
        useCallback(() => {
            hasContinuedRef.current = false;
        }, []),
    );

    useEffect(
        () =>
            navigation.addListener('beforeRemove', e => {
                // Native-stack dismissals (iOS swipe-back, native header back) dispatch POP,
                // while JS navigation.goBack() dispatches GO_BACK.
                const isBackRemoval =
                    e.data.action.type === 'GO_BACK' || e.data.action.type === 'POP';

                if (isBackRemoval && !hasContinuedRef.current) {
                    analytics.report(eventRef.current);
                }
            }),
        [navigation, analytics],
    );

    return useCallback(() => {
        hasContinuedRef.current = true;
    }, []);
};

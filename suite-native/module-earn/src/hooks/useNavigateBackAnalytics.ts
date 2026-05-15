import { useCallback, useEffect, useRef } from 'react';

import { useFocusEffect, useNavigation } from '@react-navigation/native';

import { useServices } from '@suite-common/dependency-injection';
import { type AnalyticsNativeEvents, type NativeAnalyticsDep } from '@suite-native/analytics';

export const useNavigateBackAnalytics = (event: AnalyticsNativeEvents) => {
    const { analytics } = useServices<NativeAnalyticsDep>();
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
                if (e.data.action.type === 'GO_BACK' && !hasContinuedRef.current) {
                    analytics.report(eventRef.current);
                }
            }),
        [navigation, analytics],
    );

    return useCallback(() => {
        hasContinuedRef.current = true;
    }, []);
};

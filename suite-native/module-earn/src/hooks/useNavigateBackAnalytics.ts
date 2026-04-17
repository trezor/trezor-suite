import { useCallback, useEffect, useRef } from 'react';

import { useFocusEffect, useNavigation } from '@react-navigation/native';

import { type AnalyticsNativeEvents } from '@suite-native/analytics';
import { useAnalytics } from '@suite-native/services';

export const useNavigateBackAnalytics = (event: AnalyticsNativeEvents) => {
    const analytics = useAnalytics();
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

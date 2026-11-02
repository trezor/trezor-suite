import { useCallback, useEffect, useRef } from 'react';

import { useFocusEffect, useNavigation } from '@react-navigation/native';

import { type AnalyticsNativeEvents, injectNativeAnalytics } from '@suite-native/analytics';
import { useServices } from '@trezor/dependency-injection';

export const useNavigateBackAnalytics = (event: AnalyticsNativeEvents, isEnabled = true) => {
    const { analytics } = useServices(injectNativeAnalytics);
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
                // while JS navigation.goBack() dispatches GO_BACK. Closing a yield stack uses POP_TO_TOP.
                const isBackRemoval =
                    e.data.action.type === 'GO_BACK' ||
                    e.data.action.type === 'POP' ||
                    e.data.action.type === 'POP_TO_TOP';

                if (
                    isEnabled &&
                    isBackRemoval &&
                    navigation.isFocused() &&
                    !hasContinuedRef.current
                ) {
                    analytics.report(eventRef.current);
                }
            }),
        [navigation, analytics, isEnabled],
    );

    return useCallback(() => {
        hasContinuedRef.current = true;
    }, []);
};

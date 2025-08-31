import { useCallback } from 'react';

import { useFocusEffect, useNavigation } from '@react-navigation/native';

export const useOverrideBackNavigation = ({
    onNavigateBack,
    gestureEnabled = false,
}: { onNavigateBack?: () => void; gestureEnabled?: boolean } = {}) => {
    const navigation = useNavigation();

    useFocusEffect(
        useCallback(() => {
            // iOS only - disable swipe back gesture
            navigation.getParent()?.setOptions({ gestureEnabled });

            const unsubscribe = navigation.addListener('beforeRemove', e => {
                if (e.data.action.type === 'GO_BACK') {
                    e.preventDefault();
                    onNavigateBack?.();
                }
            });

            return () => {
                navigation.getParent()?.setOptions({ gestureEnabled: true });
                unsubscribe();
            };
        }, [navigation, onNavigateBack, gestureEnabled]),
    );
};

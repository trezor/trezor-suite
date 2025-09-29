import { useCallback } from 'react';

import { useFocusEffect, useNavigation } from '@react-navigation/native';

import { useDisableIOSGesture } from './useDisableIOSGesture';

export const useOverrideBackNavigation = ({
    onNavigateBack,
}: { onNavigateBack?: () => void; gestureEnabled?: boolean } = {}) => {
    useDisableIOSGesture();
    const navigation = useNavigation();

    useFocusEffect(
        useCallback(() => {
            const unsubscribe = navigation.addListener('beforeRemove', e => {
                if (e.data.action.type === 'GO_BACK') {
                    e.preventDefault();
                    onNavigateBack?.();
                }
            });

            return () => {
                unsubscribe();
            };
        }, [navigation, onNavigateBack]),
    );
};

import { useCallback } from 'react';
import { BackHandler } from 'react-native';

import { useFocusEffect } from '@react-navigation/native';

export const useHandleHardwareBackNavigation = (onPress?: () => void) => {
    useFocusEffect(
        useCallback(() => {
            // do nothing unless onPress has some custom handling
            const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
                onPress?.();

                return true;
            });

            return () => subscription.remove();
        }, [onPress]),
    );
};

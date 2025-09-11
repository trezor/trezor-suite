import { useCallback } from 'react';
import { BackHandler } from 'react-native';

import { useFocusEffect, useNavigation } from '@react-navigation/native';

export const useHandleHardwareBackNavigation = (onPress?: () => void) => {
    const navigation = useNavigation();

    useFocusEffect(
        useCallback(() => {
            // do nothing unless onPress has some custom handling
            const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
                onPress?.();

                return true;
            });

            return () => {
                navigation.getParent()?.setOptions({ gestureEnabled: true });
                subscription.remove();
            };
        }, [navigation, onPress]),
    );
};

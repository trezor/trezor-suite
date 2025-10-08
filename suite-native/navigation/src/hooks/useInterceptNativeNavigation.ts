import { useCallback } from 'react';
import { BackHandler } from 'react-native';

import { useFocusEffect } from '@react-navigation/native';

import { useDisableIOSGesture } from './useDisableIOSGesture';

type Props = {
    onPress?: () => void;
    preventDefaultNavigation?: boolean;
};

export const useInterceptNativeNavigation = ({
    onPress,
    preventDefaultNavigation = true,
}: Props = {}) => {
    useDisableIOSGesture();

    useFocusEffect(
        useCallback(() => {
            // do nothing unless onPress has some custom handling
            const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
                onPress?.();

                return preventDefaultNavigation;
            });

            return () => {
                subscription.remove();
            };
        }, [onPress, preventDefaultNavigation]),
    );
};

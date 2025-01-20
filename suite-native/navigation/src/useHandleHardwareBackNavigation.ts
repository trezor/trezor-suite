import { useEffect } from 'react';
import { BackHandler } from 'react-native';

export const useHandleHardwareBackNavigation = (onPress?: () => void) => {
    useEffect(() => {
        // do nothing unless onPress has some custom handling
        const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
            onPress?.();

            return true;
        });

        return () => subscription.remove();
    }, [onPress]);
};

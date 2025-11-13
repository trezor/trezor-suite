import { useCallback, useLayoutEffect } from 'react';
import { Platform } from 'react-native';

import { useNavigation } from '@react-navigation/native';

export const useDisableIOSGesture = () => {
    const navigation = useNavigation();

    const toggleGestures = useCallback((nav: typeof navigation, enable: boolean) => {
        nav?.setOptions({ gestureEnabled: enable });
        const parent = nav?.getParent?.();
        if (parent) {
            // This code is OK, but the eslint plugin crashes on recursive calls
            // eslint-disable-next-line react-hooks/immutability
            toggleGestures(parent, enable);
        }
    }, []);

    useLayoutEffect(() => {
        if (Platform.OS === 'ios') {
            toggleGestures(navigation, false);
        }

        return () => {
            if (Platform.OS === 'ios') {
                toggleGestures(navigation, true);
            }
        };
    }, [navigation, toggleGestures]);
};

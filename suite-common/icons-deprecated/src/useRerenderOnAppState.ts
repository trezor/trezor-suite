import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

/**
 * It's necessary because Skia Android bug when Icon components are used in Modal component.
 * After app is suspended to background and then resumed, icons are not rendered.
 * This is a workaround for this issue.
 * @see https://github.com/Shopify/react-native-skia/issues/2135
 */
export const useRerenderOnAppStateChange = () => {
    const [_, setRerender] = useState(0);

    useEffect(() => {
        const handleChange = () => {
            setRerender(prev => prev + 1);
        };
        const subscription = AppState.addEventListener('change', handleChange);

        return () => subscription.remove();
    }, []);
};

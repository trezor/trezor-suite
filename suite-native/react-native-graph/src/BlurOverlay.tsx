import { useEffect } from 'react';
import { useSharedValue, withTiming } from 'react-native-reanimated';

import { BlurMask } from '@shopify/react-native-skia';

export const BlurOverlay = ({ isVisible, blur = 2 }: { isVisible: boolean; blur?: number }) => {
    const blurAmount = useSharedValue(isVisible ? blur : 0);
    useEffect(() => {
        if (isVisible) {
            blurAmount.value = withTiming(blur, { duration: 300 });
        } else {
            blurAmount.value = 0;
        }
    }, [isVisible, blur, blurAmount]);

    return <BlurMask blur={blurAmount} style="normal" />;
};

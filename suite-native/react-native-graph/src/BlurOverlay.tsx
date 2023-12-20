import { useSharedValue, withTiming } from 'react-native-reanimated';
import { useEffect } from 'react';

import { BlurMask } from '@shopify/react-native-skia';

export const BlurOverlay = ({ isVisible, blur = 2 }: { isVisible: boolean; blur?: number }) => {
    const blurAmount = useSharedValue(0);
    useEffect(() => {
        blurAmount.value = 0;
        if (isVisible) {
            blurAmount.value = withTiming(blur, { duration: 300 });
        }
    }, [isVisible, blur, blurAmount]);

    return <BlurMask blur={blurAmount} style="normal" />;
};

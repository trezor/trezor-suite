import {
    interpolateColor,
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from 'react-native-reanimated';

import { useNativeStyles } from '@trezor/styles-native';

const ANIMATION_DURATION_MS = 100;

export const useTradingAssetPressStyle = () => {
    const { utils } = useNativeStyles();
    const progress = useSharedValue(0);

    const handlePressIn = () =>
        (progress.value = withTiming(1, { duration: ANIMATION_DURATION_MS }));
    const handlePressOut = () =>
        (progress.value = withTiming(0, { duration: ANIMATION_DURATION_MS }));
    const animatedStyle = useAnimatedStyle(() => ({
        backgroundColor: interpolateColor(
            progress.value,
            [0, 1],
            ['transparent', utils.colors.elementFillGhostPressed],
        ),
    }));

    return { animatedStyle, handlePressIn, handlePressOut };
};

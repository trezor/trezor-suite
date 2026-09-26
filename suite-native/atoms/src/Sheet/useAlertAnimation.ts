import { useCallback, useEffect } from 'react';
import { useWindowDimensions } from 'react-native';
import {
    Easing,
    cancelAnimation,
    interpolateColor,
    runOnJS,
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from 'react-native-reanimated';

import { useNativeStyles } from '@trezor/styles-native';

const ANIMATION_DURATION = 300;

export const useAlertAnimation = ({ onClose }: { onClose?: () => void }) => {
    const { utils } = useNativeStyles();
    const { height: windowHeight } = useWindowDimensions();
    const transparency = 1;
    const colorOverlay = utils.colors.surfaceFillMediaOverlay;
    const translatePanY = useSharedValue(windowHeight);
    const animatedTransparency = useSharedValue(transparency);

    useEffect(() => {
        animatedTransparency.value = withTiming(transparency, {
            duration: ANIMATION_DURATION,
            easing: Easing.out(Easing.cubic),
        });
    }, [animatedTransparency, transparency]);

    useEffect(() => () => cancelAnimation(animatedTransparency), [animatedTransparency]);

    const animatedSheetWithOverlayStyle = useAnimatedStyle(() => ({
        backgroundColor: interpolateColor(
            animatedTransparency.value,
            [0, 1],
            ['transparent', colorOverlay],
        ),
    }));

    const animatedSheetWrapperStyle = useAnimatedStyle(() => ({
        transform: [
            {
                translateY: translatePanY.value,
            },
        ],
    }));

    const closeSheetAnimated = useCallback(
        () =>
            new Promise((resolve, _) => {
                translatePanY.value = withTiming(windowHeight, {
                    duration: ANIMATION_DURATION,
                    easing: Easing.out(Easing.cubic),
                });
                animatedTransparency.value = withTiming(
                    0,
                    {
                        duration: ANIMATION_DURATION,
                        easing: Easing.out(Easing.cubic),
                    },
                    () => {
                        if (onClose) runOnJS(onClose)();
                    },
                );

                setTimeout(resolve, ANIMATION_DURATION);
            }),
        [translatePanY, animatedTransparency, onClose, windowHeight],
    );

    const openSheetAnimated = useCallback(() => {
        'worklet';

        // eslint-disable-next-line react-hooks/immutability
        translatePanY.value = withTiming(0, {
            duration: 300,
            easing: Easing.out(Easing.cubic),
        });
    }, [translatePanY]);

    return {
        animatedSheetWithOverlayStyle,
        animatedSheetWrapperStyle,
        closeSheetAnimated,
        openSheetAnimated,
    };
};

import { useCallback, useEffect } from 'react';
import {
    Easing,
    interpolateColor,
    runOnJS,
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from 'react-native-reanimated';

import { getScreenHeight } from '@trezor/env-utils';
import { useNativeStyles } from '@trezor/styles-native';

const ANIMATION_DURATION = 300;
const SCREEN_HEIGHT = getScreenHeight();

export const useAlertAnimation = ({ onClose }: { onClose?: () => void }) => {
    const { utils } = useNativeStyles();
    const transparency = 1;
    const colorOverlay = utils.transparentize(0.3, utils.colors.legacyBackgroundNeutralBold);
    const translatePanY = useSharedValue(SCREEN_HEIGHT);
    const animatedTransparency = useSharedValue(transparency);

    useEffect(() => {
        animatedTransparency.value = withTiming(transparency, {
            duration: ANIMATION_DURATION,
            easing: Easing.out(Easing.cubic),
        });
    });

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
                translatePanY.value = withTiming(SCREEN_HEIGHT, {
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
        [translatePanY, animatedTransparency, onClose],
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

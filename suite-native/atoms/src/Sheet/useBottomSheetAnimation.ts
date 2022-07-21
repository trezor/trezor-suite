import {
    Easing,
    interpolate,
    interpolateColor,
    runOnJS,
    useAnimatedGestureHandler,
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from 'react-native-reanimated';
import { useCallback, useEffect } from 'react';
import { PanGestureHandlerGestureEvent } from 'react-native-gesture-handler';
import { Dimensions } from 'react-native';

import { useNativeStyles } from '@trezor/styles';

type GestureHandlerContext = {
    translatePanY: number;
};

const SCREEN_HEIGHT = Dimensions.get('screen').height;

export const useBottomSheetAnimation = ({
    onVisibilityChange,
    isVisible,
}: {
    onVisibilityChange: (isVisible: boolean) => void;
    isVisible: boolean;
}) => {
    const { utils } = useNativeStyles();
    const transparency = isVisible ? 1 : 0;
    const colorOverlay = utils.transparentize(0.3, utils.colors.black);
    const translatePanY = useSharedValue(SCREEN_HEIGHT);
    const animatedTransparency = useSharedValue(transparency);

    useEffect(() => {
        animatedTransparency.value = withTiming(transparency, {
            duration: 300,
            easing: Easing.out(Easing.cubic),
        });
    }, [transparency, animatedTransparency]);

    const animatedSheetWithOverlayStyle = useAnimatedStyle(
        () => ({
            backgroundColor: interpolateColor(
                animatedTransparency.value,
                [0, 1],
                ['transparent', colorOverlay],
            ),
        }),
        [transparency, animatedTransparency],
    );

    const animatedSheetWrapperStyle = useAnimatedStyle(() => ({
        top: interpolate(translatePanY.value, [-1, 0, 1], [0, 0, 1]),
    }));

    const closeSheetAnimated = useCallback(() => {
        'worklet';

        translatePanY.value = withTiming(SCREEN_HEIGHT, {
            duration: 300,
            easing: Easing.out(Easing.cubic),
        });
        animatedTransparency.value = withTiming(
            0,
            {
                duration: 300,
                easing: Easing.out(Easing.cubic),
            },
            () => {
                runOnJS(onVisibilityChange)(false);
            },
        );
    }, [translatePanY, animatedTransparency, onVisibilityChange]);

    const resetSheetAnimated = useCallback(() => {
        'worklet';

        translatePanY.value = withTiming(0, {
            duration: 300,
            easing: Easing.out(Easing.cubic),
        });
    }, [translatePanY]);

    const panGestureEvent = useAnimatedGestureHandler<
        PanGestureHandlerGestureEvent,
        GestureHandlerContext
    >({
        onStart: (_, context) => {
            context.translatePanY = translatePanY.value;
        },
        onActive: (event, context) => {
            const { translationY } = event;
            translatePanY.value = translationY + context.translatePanY;
        },
        onEnd: event => {
            const { translationY, velocityY } = event;
            if (translationY > 50 && velocityY > 2) {
                closeSheetAnimated();
            } else {
                resetSheetAnimated();
            }
        },
    });

    return {
        animatedSheetWithOverlayStyle,
        animatedSheetWrapperStyle,
        closeSheetAnimated,
        resetSheetAnimated,
        panGestureEvent,
    };
};

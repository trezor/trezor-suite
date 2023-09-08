import {
    Easing,
    runOnJS,
    useAnimatedGestureHandler,
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from 'react-native-reanimated';
import { useCallback, useEffect } from 'react';
import { PanGestureHandlerGestureEvent } from 'react-native-gesture-handler';
import { NativeScrollEvent } from 'react-native';

import { getScreenHeight } from '@trezor/env-utils';

type GestureHandlerContext = {
    translatePanY: number;
};

const ANIMATION_DURATION = 300;
const SCREEN_HEIGHT = getScreenHeight();

export const useBottomSheetAnimation = ({
    onClose,
    isVisible,
    setIsCloseScrollEnabled,
    isCloseScrollEnabled = false,
}: {
    isVisible: boolean;
    onClose?: (isVisible: boolean) => void;
    setIsCloseScrollEnabled?: (isCloseScrollEnabled: boolean) => void;
    isCloseScrollEnabled?: boolean;
}) => {
    const transparency = isVisible ? 1 : 0;
    const translatePanY = useSharedValue(SCREEN_HEIGHT);
    const animatedTransparency = useSharedValue(transparency);

    useEffect(() => {
        animatedTransparency.value = withTiming(transparency, {
            duration: ANIMATION_DURATION,
            easing: Easing.out(Easing.cubic),
        });
    }, [transparency, animatedTransparency]);

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
                        if (onClose) runOnJS(onClose)(false);
                        if (setIsCloseScrollEnabled) runOnJS(setIsCloseScrollEnabled)(true);
                    },
                );

                setTimeout(resolve, ANIMATION_DURATION);
            }),
        [translatePanY, animatedTransparency, onClose, setIsCloseScrollEnabled],
    );

    const openSheetAnimated = useCallback(() => {
        'worklet';

        translatePanY.value = withTiming(0, {
            duration: 300,
            easing: Easing.out(Easing.cubic),
        });
    }, [translatePanY]);

    const scrollEvent = ({ nativeEvent }: { nativeEvent: NativeScrollEvent }) => {
        if (!setIsCloseScrollEnabled) return;

        if (nativeEvent.contentOffset.y <= 0 && !isCloseScrollEnabled) {
            setIsCloseScrollEnabled(true);
        }
        if (nativeEvent.contentOffset.y > 0 && isCloseScrollEnabled) {
            setIsCloseScrollEnabled(false);
        }
    };

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
                runOnJS(closeSheetAnimated)();
            } else {
                openSheetAnimated();
            }
        },
    });

    return {
        animatedSheetWrapperStyle,
        closeSheetAnimated,
        openSheetAnimated,
        panGestureEvent,
        scrollEvent,
    };
};

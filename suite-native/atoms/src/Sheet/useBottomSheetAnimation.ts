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
import { Dimensions, NativeScrollEvent } from 'react-native';

import { useNativeStyles } from '@trezor/styles';

type GestureHandlerContext = {
    translatePanY: number;
};

const SCREEN_HEIGHT = Dimensions.get('screen').height;

export const useBottomSheetAnimation = ({
    onVisibilityChange,
    isVisible,
    isCloseScrollEnabled,
    setIsCloseScrollEnabled,
}: {
    onVisibilityChange: (isVisible: boolean) => void;
    isVisible: boolean;
    isCloseScrollEnabled: boolean;
    setIsCloseScrollEnabled: (isCloseScrollEnabled: boolean) => void;
}) => {
    const { utils } = useNativeStyles();
    const transparency = isVisible ? 1 : 0;
    const colorOverlay = utils.transparentize(0.3, utils.colors.gray1000);
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
                runOnJS(setIsCloseScrollEnabled)(true);
            },
        );
    }, [translatePanY, animatedTransparency, onVisibilityChange, setIsCloseScrollEnabled]);

    const openSheetAnimated = useCallback(() => {
        'worklet';

        translatePanY.value = withTiming(0, {
            duration: 300,
            easing: Easing.out(Easing.cubic),
        });
    }, [translatePanY]);

    const scrollEvent = ({ nativeEvent }: { nativeEvent: NativeScrollEvent }) => {
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
                closeSheetAnimated();
            } else {
                openSheetAnimated();
            }
        },
    });

    return {
        animatedSheetWithOverlayStyle,
        animatedSheetWrapperStyle,
        closeSheetAnimated,
        openSheetAnimated,
        panGestureEvent,
        scrollEvent,
    };
};

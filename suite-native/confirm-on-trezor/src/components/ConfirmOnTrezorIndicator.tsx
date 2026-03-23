import React, { useEffect } from 'react';
import Animated, {
    Easing,
    interpolate,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withTiming,
} from 'react-native-reanimated';

import { AnimatedBox } from '@suite-native/atoms';
import { isDetoxTestBuild } from '@suite-native/config';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

const containerStyle = prepareNativeStyle(() => ({
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
}));

const centerDotStyle = prepareNativeStyle(utils => ({
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: utils.colors.backgroundSecondaryDefault,
    zIndex: 3,
}));

const ringStyle = prepareNativeStyle(utils => ({
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: utils.colors.backgroundSecondaryDefault,
    backgroundColor: 'transparent',
    zIndex: 2,
}));

const shadowRingStyle = prepareNativeStyle(utils => ({
    position: 'absolute',
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: utils.colors.backgroundSecondaryDefault,
    zIndex: 1,
}));

const INDICATOR_ANIMATION_REPEAT = isDetoxTestBuild() ? 1 : -1;

export const ConfirmOnTrezorIndicator = () => {
    const { applyStyle } = useNativeStyles();
    const breathing = useSharedValue(0);

    useEffect(() => {
        breathing.value = withRepeat(
            withTiming(1, {
                duration: 1400,
                easing: Easing.bezier(0.4, 0, 0.6, 1),
            }),
            INDICATOR_ANIMATION_REPEAT,
            true,
        );
    }, [breathing]);

    const animatedRingStyle = useAnimatedStyle(() => ({
        transform: [{ scale: interpolate(breathing.value, [0, 1], [1, 1.3]) }],
        opacity: interpolate(breathing.value, [0, 0.5, 1], [0.6, 0.35, 0]),
    }));

    const animatedShadowStyle = useAnimatedStyle(() => ({
        transform: [{ scale: interpolate(breathing.value, [0, 1], [0.9, 1.6]) }],
        opacity: interpolate(breathing.value, [0, 0.3, 0.7, 1], [0, 0.2, 0.1, 0]),
    }));

    const animatedCenterStyle = useAnimatedStyle(() => ({
        transform: [
            { scale: interpolate(breathing.value, [0, 0.4, 0.7, 1], [1, 1.08, 1.1, 1.05]) },
        ],
        opacity: interpolate(breathing.value, [0, 1], [1, 0.7]),
    }));

    return (
        <AnimatedBox style={applyStyle(containerStyle)}>
            <Animated.View style={[applyStyle(shadowRingStyle), animatedShadowStyle]} />
            <Animated.View style={[applyStyle(ringStyle), animatedRingStyle]} />
            <Animated.View style={[applyStyle(centerDotStyle), animatedCenterStyle]} />
        </AnimatedBox>
    );
};

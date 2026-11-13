import {
    interpolateColor,
    useAnimatedStyle,
    useDerivedValue,
    withTiming,
} from 'react-native-reanimated';

import { useNativeStyles } from '@trezor/styles-native';
import { type CSSColor, type Color } from '@trezor/theme';

import { pressTimingConfig } from '../constants';

export const useButtonPressAnimatedStyles = (
    isPressed: boolean,
    isDisabled: boolean,
    backgroundColor: Color,
    onPressColor: Color,
) => {
    const { utils } = useNativeStyles();
    const pressAnimationValue = useDerivedValue(() =>
        isPressed && !isDisabled
            ? withTiming(1, pressTimingConfig)
            : withTiming(0, pressTimingConfig),
    );

    const buttonPressStyle = useAnimatedStyle(() => ({
        transform: [{ scale: 1 - (1 - 0.95) * pressAnimationValue.value }],
    }));
    const buttonColorStyle = useAnimatedStyle(() => ({
        backgroundColor: interpolateColor(
            pressAnimationValue.value,
            [0, 1],
            [utils.colors[backgroundColor], utils.colors[onPressColor]],
        ) as CSSColor,
    }));

    return [buttonPressStyle, buttonColorStyle];
};

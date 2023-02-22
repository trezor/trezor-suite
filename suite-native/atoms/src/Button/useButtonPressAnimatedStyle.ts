import {
    interpolateColor,
    useAnimatedStyle,
    useDerivedValue,
    withTiming,
} from 'react-native-reanimated';

import { useNativeStyles } from '@trezor/styles';
import { Color } from '@trezor/theme';

const pressTimingConfig = { duration: 70 };

export const useButtonPressAnimatedStyle = (
    isPressed: boolean,
    isDisabled: boolean,
    backgroundColor: Color,
    onPressColor: Color,
) => {
    const { utils } = useNativeStyles();
    const pressAnimationValue = useDerivedValue(
        () => (isPressed ? withTiming(1, pressTimingConfig) : withTiming(0, pressTimingConfig)),
        [isPressed],
    );
    const animatedPressStyle = useAnimatedStyle(() => ({
        backgroundColor: interpolateColor(
            pressAnimationValue.value,
            [0, 1],
            [utils.colors[backgroundColor], utils.colors[onPressColor]],
        ),
    }));

    if (isDisabled) return;

    return animatedPressStyle;
};

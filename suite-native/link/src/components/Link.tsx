import React from 'react';
import { GestureResponderEvent } from 'react-native';
import Animated, {
    useAnimatedStyle,
    interpolateColor,
    withTiming,
    useSharedValue,
} from 'react-native-reanimated';

import { useNativeStyles } from '@trezor/styles';

import { useOpenLink } from '../useOpenLink';

type LinkProps = {
    label: string;
    href: string;
};

const ANIMATION_DURATION = 100;
const IS_NOT_PRESSED_VALUE = 0;
const IS_PRESSED_VALUE = 1;

export const Link = ({ href, label }: LinkProps) => {
    const { utils } = useNativeStyles();
    const openLink = useOpenLink();
    const isPressed = useSharedValue(IS_NOT_PRESSED_VALUE);

    const textColorStyle = useAnimatedStyle(() => ({
        color: interpolateColor(
            isPressed.value,
            [IS_NOT_PRESSED_VALUE, IS_PRESSED_VALUE],
            [utils.colors.textPrimaryDefault, utils.colors.textPrimaryPressed],
        ),
    }));

    const handlePressIn = () => {
        isPressed.value = withTiming(IS_PRESSED_VALUE, { duration: ANIMATION_DURATION });
    };

    const handlePress = (e: GestureResponderEvent) => {
        openLink(href);
        e.stopPropagation();
    };

    const handlePressOut = () => {
        isPressed.value = withTiming(IS_NOT_PRESSED_VALUE, { duration: ANIMATION_DURATION });
    };

    return (
        <Animated.Text
            onPressIn={handlePressIn}
            onPress={handlePress}
            onPressOut={handlePressOut}
            style={textColorStyle}
            suppressHighlighting
        >
            {label}
        </Animated.Text>
    );
};

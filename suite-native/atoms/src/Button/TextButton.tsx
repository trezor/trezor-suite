import React from 'react';
import { Pressable } from 'react-native';
import Animated, {
    interpolateColor,
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from 'react-native-reanimated';

import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { ButtonIcon, ButtonProps, ButtonSize, buttonToTextSizeMap } from './Button';
import { BUTTON_PRESS_ANIMATION_DURATION } from './useButtonPressAnimatedStyle';
import { HStack } from '../Stack';

type TextButtonProps = Omit<ButtonProps, 'colorScheme'>;

const buttonContainerStyle = prepareNativeStyle(() => ({
    alignItems: 'center',
}));

const textStyle = prepareNativeStyle((utils, { buttonSize }: { buttonSize: ButtonSize }) => ({
    ...utils.typography[buttonToTextSizeMap[buttonSize]],
}));

export const TextButton = ({
    iconLeft,
    iconRight,
    style,
    children,
    size = 'medium',
    isDisabled = false,
    ...pressableProps
}: TextButtonProps) => {
    const { applyStyle, utils } = useNativeStyles();
    const textPressedColorValue = useSharedValue(0);
    const animatedColor = useSharedValue(utils.colors.textPrimaryDefault);

    const animatedTextStyle = useAnimatedStyle(
        () => ({
            color: isDisabled ? utils.colors.textDisabled : animatedColor.value,
        }),
        [isDisabled],
    );

    const interpolatePressColor = () => {
        animatedColor.value = interpolateColor(
            textPressedColorValue.value,
            [0, 1],
            [utils.colors.textPrimaryPressed, utils.colors.textPrimaryDefault],
        );
    };

    const handlePressIn = () => {
        textPressedColorValue.value = withTiming(1, { duration: BUTTON_PRESS_ANIMATION_DURATION });
        interpolatePressColor();
    };
    const handlePressOut = () => {
        textPressedColorValue.value = withTiming(0, { duration: BUTTON_PRESS_ANIMATION_DURATION });
        interpolatePressColor();
    };

    const iconName = iconLeft || iconRight;
    const icon = iconName ? (
        <ButtonIcon
            iconName={iconName}
            color={isDisabled ? 'iconDisabled' : animatedColor}
            buttonSize={size}
        />
    ) : null;

    return (
        <Pressable
            disabled={isDisabled}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            style={applyStyle(buttonContainerStyle)}
            {...pressableProps}
        >
            <HStack alignItems="center">
                {iconLeft && icon}
                <Animated.Text
                    style={[
                        applyStyle(textStyle, { buttonSize: size, isDisabled }),
                        animatedTextStyle,
                    ]}
                >
                    {children}
                </Animated.Text>
                {iconRight && icon}
            </HStack>
        </Pressable>
    );
};

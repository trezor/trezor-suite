import React, { useState } from 'react';
import { Pressable, PressableProps } from 'react-native';
import Animated from 'react-native-reanimated';

import { Icon, IconName } from '@trezor/icons';
import {
    NativeStyleObject,
    prepareNativeStyle,
    mergeNativeStyles,
    useNativeStyles,
} from '@trezor/styles';

import {
    ButtonColorScheme,
    ButtonSize,
    buttonSchemeToColorsMap,
    buttonStyle,
    ButtonStyleProps,
} from './Button';
import { Box } from '../Box';
import { Text } from '../Text';
import { useButtonPressAnimatedStyle } from './useButtonPressAnimatedStyle';

type IconButtonProps = Omit<PressableProps, 'style' | 'onPressIn' | 'onPressOut'> & {
    iconName: IconName;
    colorScheme?: ButtonColorScheme;
    size?: ButtonSize;
    style?: NativeStyleObject;
    title?: string;
    isDisabled?: boolean;
};

const iconButtonStyle = mergeNativeStyles([
    buttonStyle,
    prepareNativeStyle<ButtonStyleProps>((_, { size, hasTitle }) => {
        const sizeDimensions = {
            small: 40,
            medium: 48,
            large: 56,
        } as const satisfies Record<ButtonSize, number>;

        return {
            padding: 0,
            height: sizeDimensions[size],
            width: hasTitle ? 'auto' : sizeDimensions[size],
        };
    }),
]);

export const IconButton = ({
    iconName,
    style,
    title,
    colorScheme = 'primary',
    size = 'medium',
    isDisabled = false,
    ...pressableProps
}: IconButtonProps) => {
    const [isPressed, setIsPressed] = useState(false);
    const { applyStyle } = useNativeStyles();
    const { textColor, disabledTextColor, backgroundColor, onPressColor } =
        buttonSchemeToColorsMap[colorScheme];

    const animatedPressStyle = useButtonPressAnimatedStyle(
        isPressed,
        isDisabled,
        backgroundColor,
        onPressColor,
    );

    const iconColor = isDisabled ? disabledTextColor : textColor;

    const handlePressIn = () => setIsPressed(true);
    const handlePressOut = () => setIsPressed(false);
    return (
        <Box alignItems="center" style={style}>
            <Pressable
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                disabled={isDisabled}
                {...pressableProps}
            >
                <Box alignItems="center">
                    <Animated.View
                        style={[
                            animatedPressStyle,
                            applyStyle(iconButtonStyle, {
                                size,
                                colorScheme,
                                isDisabled,
                            }),
                            style,
                        ]}
                    >
                        <Icon name={iconName} color={iconColor} size={size} />
                    </Animated.View>
                    <Text variant="label" color="gray600">
                        {title}
                    </Text>
                </Box>
            </Pressable>
        </Box>
    );
};

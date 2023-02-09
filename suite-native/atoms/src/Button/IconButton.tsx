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
    ButtonColorSchemeName,
    ButtonSize,
    buttonSchemeToColorsMap,
    buttonStyle,
    ButtonStyleProps,
} from './Button';
import { Box } from '../Box';
import { Text } from '../Text';
import { useButtonPressAnimatedStyle } from './useButtonPressAnimatedStyle';

type IconButtonProps = Omit<PressableProps, 'style'> & {
    iconName: IconName;
    colorSchemeName?: ButtonColorSchemeName;
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
    colorSchemeName = 'primary',
    size = 'medium',
    isDisabled = false,
    ...pressableProps
}: IconButtonProps) => {
    const [isPressed, setIsPressed] = useState(false);
    const { applyStyle } = useNativeStyles();
    const { textColor, disabledTextColor, backgroundColor, onPressColor } =
        buttonSchemeToColorsMap[colorSchemeName];

    const animatedPressStyle = useButtonPressAnimatedStyle(
        isPressed,
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
                <Animated.View
                    style={[
                        animatedPressStyle,
                        applyStyle(iconButtonStyle, {
                            size,
                            colorSchemeName,
                            isDisabled,
                            hasTitle: !!title,
                        }),
                    ]}
                >
                    <Icon name={iconName} color={iconColor} size={size} />
                </Animated.View>
            </Pressable>
            <Pressable
                disabled={isDisabled}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                {...pressableProps}
            >
                <Text variant="label" color="gray600">
                    {title}
                </Text>
            </Pressable>
        </Box>
    );
};

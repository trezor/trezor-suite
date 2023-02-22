import React, { useState } from 'react';
import { Pressable, PressableProps, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { MergeExclusive } from 'type-fest';

import { Color, TypographyStyle, nativeSpacings } from '@trezor/theme';
import { NativeStyleObject, prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { Icon, IconName } from '@trezor/icons';

import { Text } from '../Text';
import { useButtonPressAnimatedStyle } from './useButtonPressAnimatedStyle';

export type ButtonSize = 'small' | 'medium' | 'large';
export type ButtonColorScheme = 'primary' | 'secondary' | 'tertiary' | 'danger';

export type ButtonProps = Omit<PressableProps, 'style' | 'onPressIn' | 'onPressOut'> & {
    children: string;
    colorScheme?: ButtonColorScheme;
    size?: ButtonSize;
    style?: NativeStyleObject;
    isDisabled?: boolean;
} & MergeExclusive<{ iconLeft?: IconName }, { iconRight?: IconName }>;

type ButtonColorSchemeColors = {
    backgroundColor: Color;
    onPressColor: Color;
    disabledBackgroundColor: Color;
    textColor: Color;
    disabledTextColor: Color;
};

export type ButtonStyleProps = {
    size: ButtonSize;
    colorScheme: ButtonColorScheme;
    isDisabled: boolean;
    hasTitle?: boolean;
};

type IconStyleProps = {
    position: 'left' | 'right';
};

export const buttonSchemeToColorsMap = {
    primary: {
        backgroundColor: 'forest',
        onPressColor: 'forest900',
        disabledBackgroundColor: 'gray200',
        textColor: 'gray0',
        disabledTextColor: 'gray500',
    },
    secondary: {
        backgroundColor: 'green',
        onPressColor: 'green900',
        disabledBackgroundColor: 'gray200',
        textColor: 'gray0',
        disabledTextColor: 'gray500',
    },
    tertiary: {
        backgroundColor: 'gray200',
        onPressColor: 'gray300',
        disabledBackgroundColor: 'gray200',
        textColor: 'gray800',
        disabledTextColor: 'gray500',
    },
    danger: {
        backgroundColor: 'red',
        onPressColor: 'red700',
        disabledBackgroundColor: 'gray200',
        textColor: 'gray0',
        disabledTextColor: 'gray500',
    },
} as const satisfies Record<ButtonColorScheme, ButtonColorSchemeColors>;

const sizeToDimensionsMap = {
    small: {
        height: 40,
        paddingVertical: 10,
        paddingHorizontal: nativeSpacings.medium,
    },
    medium: {
        height: 48,
        paddingVertical: 12,
        paddingHorizontal: 20,
    },
    large: {
        height: 56,
        paddingVertical: nativeSpacings.medium,
        paddingHorizontal: nativeSpacings.large,
    },
} as const satisfies Record<ButtonSize, NativeStyleObject>;

const textSizeToVariantMap = {
    small: 'hint',
    medium: 'body',
    large: 'body',
} as const satisfies Record<ButtonSize, TypographyStyle>;

const iconStyle = prepareNativeStyle((utils, { position }: IconStyleProps) => ({
    extend: [
        {
            condition: position === 'left',
            style: {
                marginRight: utils.spacings.small,
            },
        },
        {
            condition: position === 'right',
            style: {
                marginLeft: utils.spacings.small,
            },
        },
    ],
}));

export const buttonStyle = prepareNativeStyle<ButtonStyleProps>(
    (utils, { size, colorScheme, isDisabled }) => {
        const sizeDimensions = sizeToDimensionsMap[size];
        const schemeColors = buttonSchemeToColorsMap[colorScheme];
        return {
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
            borderRadius: utils.borders.radii.round,
            backgroundColor: utils.colors[schemeColors.backgroundColor],
            ...sizeDimensions,
            extend: [
                {
                    condition: isDisabled,
                    style: {
                        backgroundColor: utils.colors[schemeColors.disabledBackgroundColor],
                    },
                },
            ],
        };
    },
);

export const Button = ({
    iconLeft,
    iconRight,
    style,
    children,
    colorScheme = 'primary',
    size = 'medium',
    isDisabled = false,
    ...pressableProps
}: ButtonProps) => {
    const [isPressed, setIsPressed] = useState(false);
    const { applyStyle } = useNativeStyles();
    const { backgroundColor, onPressColor, textColor, disabledBackgroundColor, disabledTextColor } =
        buttonSchemeToColorsMap[colorScheme];

    const animatedPressStyle = useButtonPressAnimatedStyle(
        isPressed,
        isDisabled,
        backgroundColor,
        onPressColor,
    );

    const handlePressIn = () => setIsPressed(true);
    const handlePressOut = () => setIsPressed(false);

    const iconName = iconLeft || iconRight;
    const icon = iconName ? (
        <View style={applyStyle(iconStyle, { position: iconLeft ? 'left' : 'right' })}>
            <Icon
                name={iconName}
                color={isDisabled ? disabledBackgroundColor : textColor}
                size={size}
            />
        </View>
    ) : null;

    return (
        <Pressable
            disabled={isDisabled}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            {...pressableProps}
        >
            <Animated.View
                style={[
                    animatedPressStyle,
                    applyStyle(buttonStyle, {
                        size,
                        colorScheme,
                        isDisabled,
                    }),
                    style,
                ]}
            >
                {iconLeft && icon}
                <Text
                    variant={textSizeToVariantMap[size]}
                    color={isDisabled ? disabledTextColor : textColor}
                >
                    {children}
                </Text>
                {iconRight && icon}
            </Animated.View>
        </Pressable>
    );
};

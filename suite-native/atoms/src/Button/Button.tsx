import React from 'react';
import { Pressable, PressableProps, View } from 'react-native';

import { MergeExclusive } from 'type-fest';

import { Color, TypographyStyle } from '@trezor/theme';
import { NativeStyleObject, prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { Icon, IconName } from '@trezor/icons';

import { Text } from '../Text';

export type ButtonSize = 'small' | 'medium' | 'large';
export type ButtonColorSchemeName = 'primary' | 'secondary' | 'tertiary' | 'danger';

export type ButtonProps = Omit<PressableProps, 'style'> & {
    children: string;
    colorScheme?: ButtonColorSchemeName;
    size?: ButtonSize;
    style?: NativeStyleObject;
    isDisabled?: boolean;
} & MergeExclusive<{ iconLeft?: IconName }, { iconRight?: IconName }>;

type ButtonColorScheme = {
    backgroundColor: Color;
    onPressColor: Color;
    disabledBackgroundColor: Color;
    textColor: Color;
    disabledTextColor: Color;
};

export type ButtonStyleProps = {
    size: ButtonSize;
    colorScheme: ButtonColorSchemeName;
    isDisabled: boolean;
    isPressed: boolean;
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
} as const satisfies Record<ButtonColorSchemeName, ButtonColorScheme>;

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
    (utils, { size, colorScheme, isDisabled, isPressed }) => {
        const schemeColors = buttonSchemeToColorsMap[colorScheme];
        return {
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
            borderRadius: utils.borders.radii.round,
            backgroundColor: utils.colors[schemeColors.backgroundColor],
            extend: [
                {
                    condition: isDisabled,
                    style: {
                        backgroundColor: utils.colors[schemeColors.disabledBackgroundColor],
                    },
                },
                {
                    condition: isPressed,
                    style: {
                        backgroundColor: utils.colors[schemeColors.onPressColor],
                    },
                },
                {
                    condition: size === 'small',
                    style: {
                        height: 40,
                        paddingVertical: 10,
                        paddingHorizontal: utils.spacings.medium,
                    },
                },
                {
                    condition: size === 'medium',
                    style: {
                        height: 48,
                        paddingVertical: 12,
                        paddingHorizontal: 20,
                    },
                },
                {
                    condition: size === 'large',
                    style: {
                        height: 56,
                        paddingVertical: utils.spacings.medium,
                        paddingHorizontal: utils.spacings.large,
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
    const { applyStyle } = useNativeStyles();
    const buttonColors = buttonSchemeToColorsMap[colorScheme];

    const iconName = iconLeft || iconRight;
    const icon = iconName ? (
        <View style={applyStyle(iconStyle, { position: iconLeft ? 'left' : 'right' })}>
            <Icon
                name={iconName}
                color={isDisabled ? buttonColors.disabledTextColor : buttonColors.textColor}
                size={size}
            />
        </View>
    ) : null;

    const icon = iconName ? (
        <View style={applyStyle(iconStyle, { position: iconPosition })}>
            <Icon
                name={iconName}
                color={colorScheme === 'primary' ? 'gray0' : 'gray700'}
                size={size}
            />
        </View>
    ) : null;
    return (
        <Pressable
            style={({ pressed }) => [
                applyStyle(buttonStyle, {
                    size,
                    colorScheme,
                    isDisabled,
                    isPressed: pressed,
                }),
                style,
            ]}
            disabled={isDisabled}
            {...pressableProps}
        >
            {iconLeft && icon}
            <Text
                variant={textSizeToVariantMap[size]}
                color={isDisabled ? buttonColors.disabledTextColor : buttonColors.textColor}
            >
                {children}
            </Text>
            {iconRight && icon}
        </Pressable>
    );
};

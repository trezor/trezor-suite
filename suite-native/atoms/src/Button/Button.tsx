import React from 'react';
import { TouchableOpacity, TouchableOpacityProps, View } from 'react-native';

import { Color } from '@trezor/theme';
import { NativeStyleObject, prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { Icon, IconName } from '@trezor/icons';

import { Text } from '../Text';

export type ButtonSize = 'small' | 'medium' | 'large';
export type ButtonColorScheme = 'primary' | 'gray' | 'red';

export interface ButtonProps extends Omit<TouchableOpacityProps, 'style'> {
    iconName?: IconName;
    iconPosition?: 'left' | 'right';
    colorScheme?: ButtonColorScheme;
    size?: ButtonSize;
    style?: NativeStyleObject;
    isDisabled?: boolean;
}

type ButtonStyleProps = {
    size: ButtonSize;
    colorScheme: ButtonColorScheme;
    isDisabled: boolean;
};
type IconStyleProps = {
    position: 'left' | 'right';
};
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

const buttonStyle = prepareNativeStyle<ButtonStyleProps>(
    (utils, { size, colorScheme, isDisabled }) => {
        const buttonSizeStyles: Record<ButtonSize, NativeStyleObject> = {
            small: {
                height: 39,
                paddingVertical: utils.spacings.small,
                paddingHorizontal: 12,
            },
            medium: {
                height: 48,
                paddingVertical: 10,
                paddingHorizontal: utils.spacings.medium,
            },
            large: {
                height: 56,
                paddingVertical: 17,
                paddingHorizontal: utils.spacings.medium,
            },
        };

        const buttonColorSchemeStyles: Record<ButtonColorScheme, NativeStyleObject> = {
            primary: {
                backgroundColor: utils.colors.green,
            },
            gray: {
                backgroundColor: utils.colors.gray300,
            },
            red: {
                backgroundColor: utils.transparentize(0.9, utils.colors.red),
            },
        };

        return {
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
            borderRadius: utils.borders.radii.round,
            ...buttonSizeStyles[size],
            ...buttonColorSchemeStyles[colorScheme],
            extend: {
                condition: isDisabled,
                style: {
                    backgroundColor: utils.colors.gray200,
                },
            },
        };
    },
);

const buttonColorSchemeFontColor: Record<ButtonColorScheme, Color> = {
    primary: 'gray0',
    gray: 'gray800',
    red: 'red',
};

export const Button = ({
    iconName,
    iconPosition = 'left',
    style,
    children,
    colorScheme = 'primary',
    size = 'medium',
    isDisabled = false,
    ...props
}: ButtonProps) => {
    const { applyStyle } = useNativeStyles();

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
        <TouchableOpacity
            style={[applyStyle(buttonStyle, { size, colorScheme, isDisabled }), style]}
            disabled={isDisabled}
            {...props}
        >
            {iconPosition === 'left' && icon}
            <Text
                variant="highlight"
                color={isDisabled ? 'gray500' : buttonColorSchemeFontColor[colorScheme]}
            >
                {children}
            </Text>
            {iconPosition === 'right' && icon}
        </TouchableOpacity>
    );
};

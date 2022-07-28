import React, { ReactNode } from 'react';
import { TouchableOpacity, TouchableOpacityProps } from 'react-native';

import { Color } from '@trezor/theme';
import { NativeStyleObject, prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { Text } from '../Text';
import { Box } from '../Box';

export type ButtonSize = 'small' | 'medium' | 'large';
export type ButtonColorScheme = 'primary' | 'gray' | 'white';

export interface ButtonProps extends Omit<TouchableOpacityProps, 'style'> {
    leftIcon?: ReactNode;
    colorScheme?: ButtonColorScheme;
    size?: ButtonSize;
    style?: NativeStyleObject;
}

type ButtonStyleProps = {
    size: ButtonSize;
    colorScheme: ButtonColorScheme;
};

const buttonStyle = prepareNativeStyle<ButtonStyleProps>((utils, { size, colorScheme }) => {
    const buttonSizeStyles: Record<ButtonSize, NativeStyleObject> = {
        small: {
            height: 36,
            paddingVertical: utils.spacings.small,
            paddingHorizontal: 12,
            borderRadius: utils.borders.radii.small,
        },
        medium: {
            height: 44,
            paddingVertical: 10,
            paddingHorizontal: utils.spacings.medium,
            borderRadius: utils.borders.radii.small,
        },
        large: {
            height: 58,
            paddingVertical: 17,
            paddingHorizontal: utils.spacings.medium,
            borderRadius: utils.borders.radii.medium,
        },
    };

    const buttonColorSchemeStyles: Record<ButtonColorScheme, NativeStyleObject> = {
        primary: {
            backgroundColor: utils.colors.green,
        },
        gray: {
            backgroundColor: utils.colors.gray300,
        },
        white: {
            backgroundColor: utils.colors.white,
        },
    };

    return {
        flexDirection: 'row',
        justifyContent: 'center',
        ...buttonSizeStyles[size],
        ...buttonColorSchemeStyles[colorScheme],
    };
});

const buttonColorSchemeFontColor: Record<ButtonColorScheme, Color> = {
    primary: 'white',
    gray: 'gray800',
    white: 'black',
};

const leftIconStyle = prepareNativeStyle(() => ({
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 3,
}));

export const Button = ({
    leftIcon,
    style,
    children,
    colorScheme = 'primary',
    size = 'medium',
    ...props
}: ButtonProps) => {
    const { applyStyle } = useNativeStyles();

    return (
        <TouchableOpacity
            style={[applyStyle(buttonStyle, { size, colorScheme }), style]}
            {...props}
        >
            {leftIcon && <Box style={applyStyle(leftIconStyle)}>{leftIcon}</Box>}
            <Text variant="highlight" color={buttonColorSchemeFontColor[colorScheme]}>
                {children}
            </Text>
        </TouchableOpacity>
    );
};

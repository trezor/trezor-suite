import React from 'react';
import { TouchableOpacity, TouchableOpacityProps } from 'react-native';

import { Text } from './Text';
import { Color } from '@trezor/theme';
import { NativeStyleObject, prepareNativeStyle, useNativeStyles } from '@trezor/styles';

type ButtonSize = 'sm' | 'md' | 'lg';
type ButtonColorScheme = 'primary' | 'gray';

export interface ButtonProps extends Omit<TouchableOpacityProps, 'style'> {
    size: ButtonSize;
    colorScheme: ButtonColorScheme;
    style?: NativeStyleObject;
}

type ButtonStyleProps = {
    size: ButtonSize;
    colorScheme: ButtonColorScheme;
};

const buttonStyle = prepareNativeStyle<ButtonStyleProps>((utils, { size, colorScheme }) => {
    const buttonSizeStyles: Record<ButtonSize, NativeStyleObject> = {
        sm: {
            height: 36,
            paddingVertical: utils.spacings.sm,
            paddingHorizontal: 12,
            borderRadius: utils.borders.radii.basic,
        },
        md: {
            height: 44,
            paddingVertical: 10,
            paddingHorizontal: utils.spacings.md,
            borderRadius: utils.borders.radii.basic,
        },
        lg: {
            height: 58,
            paddingVertical: 17,
            paddingHorizontal: utils.spacings.md,
            borderRadius: utils.borders.radii.large,
        },
    };

    const buttonColorSchemeStyles: Record<ButtonColorScheme, NativeStyleObject> = {
        primary: {
            backgroundColor: utils.colors.green,
        },
        gray: {
            backgroundColor: utils.colors.gray300,
        },
    };

    return {
        flexDirection: 'row',
        ...buttonSizeStyles[size],
        ...buttonColorSchemeStyles[colorScheme],
    };
});

const buttonColorSchemeFontColor: Record<ButtonColorScheme, Color> = {
    primary: 'white',
    gray: 'gray700',
};

export const Button = ({ size, style, colorScheme, children, ...props }: ButtonProps) => {
    const { applyStyle } = useNativeStyles();

    return (
        <TouchableOpacity
            style={[applyStyle(buttonStyle, { size, colorScheme }), style]}
            {...props}
        >
            <Text variant="highlight" color={buttonColorSchemeFontColor[colorScheme]}>
                {children}
            </Text>
        </TouchableOpacity>
    );
};

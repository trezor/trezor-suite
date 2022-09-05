import React from 'react';
import { TouchableOpacity, TouchableOpacityProps, View } from 'react-native';

import { Color } from '@trezor/theme';
import { NativeStyleObject, prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { Icon, IconName } from '@trezor/icons';

import { Text } from '../Text';

export type ButtonSize = 'small' | 'medium' | 'large';
export type ButtonColorScheme = 'primary' | 'gray';

export interface ButtonProps extends Omit<TouchableOpacityProps, 'style'> {
    iconName?: IconName;
    colorScheme?: ButtonColorScheme;
    size?: ButtonSize;
    style?: NativeStyleObject;
}

type ButtonStyleProps = {
    size: ButtonSize;
    colorScheme: ButtonColorScheme;
};

const iconStyle = prepareNativeStyle(_ => ({ marginRight: 10.5 }));

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
    };

    return {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        ...buttonSizeStyles[size],
        ...buttonColorSchemeStyles[colorScheme],
    };
});

const buttonColorSchemeFontColor: Record<ButtonColorScheme, Color> = {
    primary: 'gray0',
    gray: 'gray800',
};

export const Button = ({
    iconName,
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
            {iconName && (
                <View style={applyStyle(iconStyle)}>
                    <Icon
                        name={iconName}
                        color={colorScheme === 'primary' ? 'gray0' : 'gray700'}
                        size={size}
                    />
                </View>
            )}
            <Text variant="highlight" color={buttonColorSchemeFontColor[colorScheme]}>
                {children}
            </Text>
        </TouchableOpacity>
    );
};

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
    isDisabled?: boolean;
}

type ButtonStyleProps = {
    size: ButtonSize;
    colorScheme: ButtonColorScheme;
    isDisabled: boolean;
};

const iconStyle = prepareNativeStyle(_ => ({ marginRight: 10.5 }));

const buttonStyle = prepareNativeStyle<ButtonStyleProps>(
    (utils, { size, colorScheme, isDisabled }) => {
        const buttonSizeStyles: Record<ButtonSize, NativeStyleObject> = {
            small: {
                height: 36,
                paddingVertical: utils.spacings.small,
                paddingHorizontal: 12,
            },
            medium: {
                height: 44,
                paddingVertical: 10,
                paddingHorizontal: utils.spacings.medium,
            },
            large: {
                height: 58,
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
};

export const Button = ({
    iconName,
    style,
    children,
    colorScheme = 'primary',
    size = 'medium',
    isDisabled = false,
    ...props
}: ButtonProps) => {
    const { applyStyle } = useNativeStyles();

    return (
        <TouchableOpacity
            style={[applyStyle(buttonStyle, { size, colorScheme, isDisabled }), style]}
            disabled={isDisabled}
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
            <Text
                variant="highlight"
                color={isDisabled ? 'gray500' : buttonColorSchemeFontColor[colorScheme]}
            >
                {children}
            </Text>
        </TouchableOpacity>
    );
};

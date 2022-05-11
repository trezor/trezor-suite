<<<<<<< HEAD
import React, { useCallback } from 'react';
=======
import React from 'react';
<<<<<<< HEAD
>>>>>>> 716b9b170 (refactor: Refactor cmp, add variants)
import { Pressable } from 'react-native';

import { Text } from './Text';
import { useNativeStyles, NativeStyleObject, prepareNativeStyle } from '@trezor/styles';
<<<<<<< HEAD

export interface NumPadButtonProps {
    value: number;
    onPress: (value: number) => void;
    style?: NativeStyleObject;
}

const BUTTON_SIZE = 48;

export const numPadButtonStyle = prepareNativeStyle(utils => ({
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: utils.borders.radii.round,
}));

export const numPadButtonTextStyle = prepareNativeStyle(utils => ({
    ...utils.typography.titleMedium,
    lineHeight: BUTTON_SIZE,
    color: utils.colors.gray700,
    textAlign: 'center',
    textAlignVertical: 'center',
}));

export const NumPadButton = ({ value, onPress, style, ...props }: NumPadButtonProps) => {
    const { applyStyle } = useNativeStyles();

    const handlePress = useCallback(() => onPress(value), [onPress, value]);

    return (
        <Pressable
            style={[applyStyle(numPadButtonStyle), style]}
            onPress={handlePress}
            android_ripple={{}}
            {...props}
        >
            <Text style={applyStyle(numPadButtonTextStyle)}>{value}</Text>
=======
import { PressableProps } from 'react-native';
=======
import { Pressable, PressableProps } from 'react-native';

import { Text } from './Text';
import { useNativeStyles, NativeStyleObject, prepareNativeStyle } from '@trezor/styles';
>>>>>>> 5986702e7 (fixup! refactor: Refactor cmp, add variants)

export interface NumPadButtonProps extends Omit<PressableProps, 'style'> {
    title: string;
    onPress: () => void;
    variant?: NumPadButtonVariant;
    style?: NativeStyleObject;
}

export type NumPadButtonVariant = 'primary' | 'secondary' | 'default';

export type NumPadButtonStyleProps = {
    variant: NumPadButtonVariant;
};

const BUTTON_SIZE = 48;
const BUTTON_FONT_SIZE = 34;

export const numPadButtonStyle = prepareNativeStyle<NumPadButtonStyleProps>(
    (utils, { variant }) => {
        const numPadButtonColorSchemeStyles: Record<NumPadButtonVariant, NativeStyleObject> = {
            primary: {
                backgroundColor: utils.colors.green,
            },
            secondary: {
                backgroundColor: utils.colors.gray300,
            },
            default: {
                backgroundColor: 'transparent',
            },
        };

        return {
            width: BUTTON_SIZE,
            height: BUTTON_SIZE,
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: utils.borders.radii.round,
            ...numPadButtonColorSchemeStyles[variant],
        };
    },
);

export const numPadButtonTextStyle = prepareNativeStyle<NumPadButtonStyleProps>(
    (utils, { variant }) => {
        const buttonTextStyles: Record<NumPadButtonVariant, NativeStyleObject> = {
            primary: {
                color: utils.colors.white,
            },
            secondary: {
                color: utils.colors.gray700,
            },
            default: {
                color: utils.colors.gray700,
            },
        };

        return {
            fontSize: BUTTON_FONT_SIZE,
            lineHeight: BUTTON_SIZE,
            textAlign: 'center',
            fontWeight: utils.fontWeights.medium,
            ...buttonTextStyles[variant],
        };
    },
);

export const NumPadButton = ({
    title,
    onPress,
    variant = 'default',
    style,
    ...rest
}: NumPadButtonProps) => {
    const { applyStyle } = useNativeStyles();

    return (
        <Pressable
            style={[applyStyle(numPadButtonStyle, { variant }), style]}
            onPress={onPress}
            android_ripple={{}}
            {...rest}
        >
            <Text style={applyStyle(numPadButtonTextStyle, { variant })} align="center">
                {title}
            </Text>
>>>>>>> 716b9b170 (refactor: Refactor cmp, add variants)
        </Pressable>
    );
};

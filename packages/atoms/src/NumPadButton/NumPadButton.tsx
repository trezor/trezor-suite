import React from 'react';
import { Pressable } from 'react-native';

import { Text } from '../Text';
import { useNativeStyles } from '@trezor/styles';
import { NumPadButtonProps } from './types';
import { numPadButtonStyle, buttonColorSchemeFontColor } from './styles';

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
            <Text color={buttonColorSchemeFontColor[variant]}>{title}</Text>
        </Pressable>
    );
};

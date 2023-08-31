import { useCallback } from 'react';
import { Platform, TouchableHighlight } from 'react-native';

import { useNativeStyles, NativeStyleObject, prepareNativeStyle } from '@trezor/styles';

import { Text } from './Text';

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
    color: utils.colors.textSubdued,
    textAlign: 'center',

    extend: [
        {
            condition: Platform.OS === 'android',
            style: {
                lineHeight: BUTTON_SIZE,
                textAlignVertical: 'center',
            },
        },
        {
            condition: Platform.OS === 'ios',
            style: {
                // sadly there is no better way how to center it on iOS
                height: 27,
            },
        },
    ],
}));

export const NumPadButton = ({ value, onPress, style, ...props }: NumPadButtonProps) => {
    const { applyStyle, utils } = useNativeStyles();

    const handlePress = useCallback(() => onPress(value), [onPress, value]);

    return (
        <TouchableHighlight
            style={[applyStyle(numPadButtonStyle), style]}
            onPress={handlePress}
            underlayColor={utils.colors.backgroundTertiaryPressedOnElevation0}
            {...props}
        >
            <Text style={applyStyle(numPadButtonTextStyle)}>{value}</Text>
        </TouchableHighlight>
    );
};

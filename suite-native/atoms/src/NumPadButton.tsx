import { useCallback } from 'react';
import { Platform, TouchableHighlight } from 'react-native';

import { useNativeStyles, NativeStyleObject, prepareNativeStyle } from '@trezor/styles';

import { Text } from './Text';

export interface NumPadButtonProps {
    value: number;
    onPress: (value: number) => void;
    style?: NativeStyleObject;
}

export const numPadButtonStyle = prepareNativeStyle(utils => ({
    backgroundColor: utils.colors.backgroundTertiaryDefaultOnElevation0,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    width: 72,
    height: 56,
    borderRadius: utils.borders.radii.round,
}));

export const numPadButtonTextStyle = prepareNativeStyle(utils => ({
    justifyContent: 'center',
    alignItems: 'center',
    ...utils.typography.titleMedium,
    color: utils.colors.textSubdued,
    textAlign: 'center',

    extend: [
        {
            condition: Platform.OS === 'android',
            style: {
                lineHeight: 56,
                textAlignVertical: 'center',
            },
        },
        {
            condition: Platform.OS === 'ios',
            style: {
                // sadly there is no better way how to center it on iOS
                height: 56,
                textAlignVertical: 'center',
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
            <Text style={applyStyle(numPadButtonTextStyle)} />
        </TouchableHighlight>
    );
};

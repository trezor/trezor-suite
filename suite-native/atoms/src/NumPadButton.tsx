import { useCallback } from 'react';
import { TouchableHighlight, TouchableHighlightProps } from 'react-native';

import { useNativeStyles, NativeStyleObject, prepareNativeStyle } from '@trezor/styles';

import { Text } from './Text';

export type NumPadButtonProps = {
    value: number;
    onPress: (value: number) => void;
    style?: NativeStyleObject;
} & TouchableHighlightProps;

export const numPadButtonStyle = prepareNativeStyle(utils => ({
    backgroundColor: utils.colors.backgroundTertiaryDefaultOnElevation1,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    width: 72,
    height: 56,
    borderRadius: utils.borders.radii.round,
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
            <Text>{'\u2022'}</Text>
        </TouchableHighlight>
    );
};

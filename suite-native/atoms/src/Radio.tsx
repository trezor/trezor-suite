import React from 'react';
import { TouchableOpacity, TouchableOpacityProps, View } from 'react-native';

import { NativeStyleObject, prepareNativeStyle, useNativeStyles } from '@trezor/styles';

type RadioValue = string | number;
export interface RadioProps extends Omit<TouchableOpacityProps, 'style' | 'onPress'> {
    value: RadioValue;
    isChecked?: boolean;
    isDisabled?: boolean;
    onPress: (value: RadioValue) => void;
    style?: NativeStyleObject;
}

type RadioStyleProps = {
    isChecked: boolean;
    isDisabled: boolean;
};

const radioStyle = prepareNativeStyle<RadioStyleProps>((utils, { isChecked, isDisabled }) => ({
    height: 24,
    width: 24,
    backgroundColor: isDisabled ? utils.colors.gray400 : utils.colors.white,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: utils.borders.radii.round,
    borderWidth: isChecked ? utils.borders.widths.large : utils.borders.widths.medium,
    borderColor: utils.colors.gray400,
    extend: {
        condition: isChecked && !isDisabled,
        style: { borderColor: utils.colors.green },
    },
}));

const radioCheckStyle = prepareNativeStyle<Omit<RadioStyleProps, 'isChecked'>>(
    (utils, { isDisabled }) => ({
        height: 14,
        width: 14,
        borderRadius: utils.borders.radii.round,
        backgroundColor: isDisabled ? utils.colors.gray600 : utils.colors.forest,
    }),
);

export const Radio = ({
    value,
    isChecked = false,
    onPress,
    isDisabled = false,
    style,
    ...props
}: RadioProps) => {
    const { applyStyle } = useNativeStyles();

    return (
        <TouchableOpacity
            disabled={isDisabled}
            onPress={() => onPress(value)}
            accessibilityRole="radio"
            accessibilityState={{ checked: isChecked, disabled: isDisabled }}
            style={[applyStyle(radioStyle, { isChecked, isDisabled }), style]}
            {...props}
        >
            {isChecked && <View style={applyStyle(radioCheckStyle, { isDisabled })} />}
        </TouchableOpacity>
    );
};

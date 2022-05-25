import React from 'react';
import { TouchableOpacity } from 'react-native';
import { NativeStyleObject, prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { Icon } from './Icon/Icon';

type CheckBoxProps = {
    isChecked: boolean;
    isDisabled?: boolean;
    onChange: (value: boolean) => void;
    style?: NativeStyleObject;
};

type CheckBoxStyleProps = {
    isChecked: boolean;
    isDisabled: boolean;
};
const checkBoxStyle = prepareNativeStyle<CheckBoxStyleProps>(
    (utils, { isChecked, isDisabled }) => ({
        height: 24,
        width: 24,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 4,
        borderWidth: utils.borders.widths.md,
        borderColor: utils.colors.gray400,
        backgroundColor: isDisabled ? utils.colors.gray400 : utils.colors.white,
        extend: [
            {
                condition: isChecked && !isDisabled,
                style: {
                    borderColor: utils.colors.green,
                    backgroundColor: utils.colors.green,
                },
            },
        ],
    }),
);

export const CheckBox = ({ isChecked, isDisabled = false, onChange, style }: CheckBoxProps) => {
    const { applyStyle } = useNativeStyles();

    return (
        <TouchableOpacity
            disabled={isDisabled}
            onPress={() => onChange(!isChecked)}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: isChecked, disabled: isDisabled }}
            style={[applyStyle(checkBoxStyle, { isChecked, isDisabled }), style]}
        >
            {isChecked && <Icon type="check" color="white" size="small" />}
        </TouchableOpacity>
    );
};

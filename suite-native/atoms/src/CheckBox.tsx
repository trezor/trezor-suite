import { TouchableOpacity } from 'react-native';

import { Icon } from '@suite-common/icons';
import { NativeStyleObject, prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { ACCESSIBILITY_FONTSIZE_MULTIPLIER } from './Text';

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

const CHECKBOX_SIZE = 24 * ACCESSIBILITY_FONTSIZE_MULTIPLIER;
const CHECKMARK_SIZE = 12 * ACCESSIBILITY_FONTSIZE_MULTIPLIER;

const checkBoxStyle = prepareNativeStyle<CheckBoxStyleProps>(
    (utils, { isChecked, isDisabled }) => ({
        height: CHECKBOX_SIZE,
        width: CHECKBOX_SIZE,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 4,
        borderWidth: utils.borders.widths.medium,
        borderColor: utils.colors.borderOnElevation1,
        backgroundColor: isDisabled
            ? utils.colors.backgroundNeutralDisabled
            : utils.colors.backgroundNeutralSubtleOnElevation1,
        extend: [
            {
                condition: isChecked && !isDisabled,
                style: {
                    borderColor: utils.colors.borderSecondary,
                    backgroundColor: utils.colors.backgroundSecondaryDefault,
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
            {isChecked && <Icon name="check" color="iconOnPrimary" size={CHECKMARK_SIZE} />}
        </TouchableOpacity>
    );
};

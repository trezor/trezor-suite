import { Icon } from '@suite-native/icons';
import { type NativeStyleObject, prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import { PressableOpacity } from './Pressable';
import { ACCESSIBILITY_FONTSIZE_MULTIPLIER } from './Text';

export type CheckBoxProps = {
    isChecked: boolean;
    isDisabled?: boolean;
    onChange: (value: boolean) => void;
    style?: NativeStyleObject;
    testID?: string;
};

type CheckBoxStyleProps = {
    isChecked: boolean;
    isDisabled: boolean;
};

const CHECKBOX_SIZE = 24 * ACCESSIBILITY_FONTSIZE_MULTIPLIER;
const CHECKMARK_SIZE = 16 * ACCESSIBILITY_FONTSIZE_MULTIPLIER;

const checkBoxStyle = prepareNativeStyle<CheckBoxStyleProps>((utils, { isChecked, isDisabled }) => {
    const backgroundColor = (() => {
        if (isChecked && isDisabled) return utils.colors.elementFillFieldSelectedDisabled;
        if (isChecked) return utils.colors.elementFillFieldSelected;
        if (isDisabled) return utils.colors.elementFillFieldDisabled;

        return utils.colors.elementFillField;
    })();

    const borderColor = (() => {
        if (isChecked) return 'transparent';
        if (isDisabled) return utils.colors.elementBorderFieldDisabled;

        return utils.colors.elementBorderField;
    })();

    return {
        height: CHECKBOX_SIZE,
        width: CHECKBOX_SIZE,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: utils.borders.radii.r4,
        borderWidth: utils.borders.widths.large,
        borderColor,
        backgroundColor,
    };
});

export const CheckBox = ({
    isChecked,
    isDisabled = false,
    onChange,
    style,
    testID,
}: CheckBoxProps) => {
    const { applyStyle } = useNativeStyles();

    return (
        <PressableOpacity
            testID={testID}
            disabled={isDisabled}
            onPress={() => onChange(!isChecked)}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: isChecked, disabled: isDisabled }}
            style={[applyStyle(checkBoxStyle, { isChecked, isDisabled }), style]}
        >
            {isChecked && <Icon name="check" color="contentPrimaryInverse" size={CHECKMARK_SIZE} />}
        </PressableOpacity>
    );
};

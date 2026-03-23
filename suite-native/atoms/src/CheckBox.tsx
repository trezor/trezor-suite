import { Icon } from '@suite-native/icons';
import { type NativeStyleObject, prepareNativeStyle, useNativeStyles } from '@trezor/styles';

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
const CHECKMARK_SIZE = 12 * ACCESSIBILITY_FONTSIZE_MULTIPLIER;

const checkBoxStyle = prepareNativeStyle<CheckBoxStyleProps>(
    (utils, { isChecked, isDisabled }) => ({
        height: CHECKBOX_SIZE,
        width: CHECKBOX_SIZE,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: utils.borders.radii.r4,
        borderWidth: utils.borders.widths.medium,
        borderColor: utils.colors.iconSubdued,
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
            {isChecked && <Icon name="check" color="iconOnPrimary" size={CHECKMARK_SIZE} />}
        </PressableOpacity>
    );
};

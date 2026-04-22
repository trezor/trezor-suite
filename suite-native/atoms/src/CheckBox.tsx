import { Icon } from '@suite-native/icons';
import { type NativeStyleObject, prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';
import { type Color } from '@trezor/theme';

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

const getBoxColor = ({ isChecked, isDisabled }: CheckBoxStyleProps): Color => {
    if (isChecked && isDisabled) return 'legacyBackgroundPrimarySubtleOnElevation0';
    if (isChecked) return 'legacyBackgroundPrimaryDefault';
    if (isDisabled) return 'legacyBorderElevationNegative';

    return 'contentSecondary';
};

const checkBoxStyle = prepareNativeStyle<CheckBoxStyleProps>((utils, { isChecked, isDisabled }) => {
    const color = getBoxColor({ isChecked, isDisabled });
    const resolvedColor = utils.colors[color];

    return {
        height: CHECKBOX_SIZE,
        width: CHECKBOX_SIZE,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: utils.borders.radii.r4,
        borderWidth: utils.borders.widths.large,
        borderColor: resolvedColor,
        backgroundColor: isChecked ? resolvedColor : 'transparent',
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

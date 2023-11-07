import { TouchableOpacity, TouchableOpacityProps, View } from 'react-native';

import { NativeStyleObject, prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { ACCESSIBILITY_FONTSIZE_MULTIPLIER } from './Text';

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

const RADIO_SIZE = 24 * ACCESSIBILITY_FONTSIZE_MULTIPLIER;
const RADIO_CHECK_SIZE = 14 * ACCESSIBILITY_FONTSIZE_MULTIPLIER;

const radioStyle = prepareNativeStyle<RadioStyleProps>((utils, { isChecked, isDisabled }) => ({
    height: RADIO_SIZE,
    width: RADIO_SIZE,
    backgroundColor: isDisabled
        ? utils.colors.backgroundNeutralDisabled
        : utils.colors.backgroundSurfaceElevation1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: utils.borders.radii.round,
    borderWidth: isChecked ? utils.borders.widths.large : utils.borders.widths.m,
    borderColor: utils.colors.borderOnElevation1,
    extend: {
        condition: isChecked && !isDisabled,
        style: { borderColor: utils.colors.borderSecondary },
    },
}));

const radioCheckStyle = prepareNativeStyle<Omit<RadioStyleProps, 'isChecked'>>(
    (utils, { isDisabled }) => ({
        height: RADIO_CHECK_SIZE,
        width: RADIO_CHECK_SIZE,
        borderRadius: utils.borders.radii.round,
        backgroundColor: isDisabled
            ? utils.colors.backgroundNeutralDisabled
            : utils.colors.backgroundPrimaryDefault,
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

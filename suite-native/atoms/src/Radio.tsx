import { type PressableProps, View } from 'react-native';

import { type NativeStyleObject, prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';
import { type Color } from '@trezor/theme';

import { PressableOpacity } from './Pressable';
import { ACCESSIBILITY_FONTSIZE_MULTIPLIER } from './Text';

export type RadioProps<TValue> = Omit<PressableProps, 'style' | 'onPress'> & {
    value: TValue;
    isChecked?: boolean;
    isDisabled?: boolean;
    onPress: (value: TValue) => void;
    style?: NativeStyleObject;
    activeColor?: Color;
};

type RadioStyleProps = {
    isChecked: boolean;
    isDisabled: boolean;
    activeColor: Color;
};

const RADIO_SIZE = 24 * ACCESSIBILITY_FONTSIZE_MULTIPLIER;
const RADIO_CHECK_SIZE = 14 * ACCESSIBILITY_FONTSIZE_MULTIPLIER;

const radioStyle = prepareNativeStyle<RadioStyleProps>(
    (utils, { isChecked, isDisabled, activeColor }) => ({
        height: RADIO_SIZE,
        width: RADIO_SIZE,
        backgroundColor: isDisabled
            ? utils.colors.backgroundNeutralDisabled
            : utils.colors.backgroundSurfaceElevation1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: utils.borders.radii.round,
        borderWidth: isChecked ? utils.borders.widths.large : utils.borders.widths.medium,
        borderColor: utils.colors.iconSubdued,
        extend: {
            condition: isChecked && !isDisabled,
            style: { borderColor: utils.colors[activeColor] },
        },
    }),
);

const radioCheckStyle = prepareNativeStyle<Omit<RadioStyleProps, 'isChecked'>>(
    (utils, { isDisabled, activeColor }) => ({
        height: RADIO_CHECK_SIZE,
        width: RADIO_CHECK_SIZE,
        borderRadius: utils.borders.radii.round,
        backgroundColor: isDisabled
            ? utils.colors.backgroundNeutralDisabled
            : utils.colors[activeColor],
    }),
);

export const Radio = <TValue extends string | number>({
    value,
    onPress,
    style,
    isChecked = false,
    isDisabled = false,
    activeColor = 'backgroundPrimaryDefault',
    ...props
}: RadioProps<TValue>) => {
    const { applyStyle } = useNativeStyles();

    return (
        <PressableOpacity
            disabled={isDisabled}
            onPress={() => onPress(value)}
            style={[applyStyle(radioStyle, { isChecked, isDisabled, activeColor }), style]}
            {...props}
        >
            {isChecked && <View style={applyStyle(radioCheckStyle, { isDisabled, activeColor })} />}
        </PressableOpacity>
    );
};

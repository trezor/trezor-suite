import { View } from 'react-native';

import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import { DecorativeControl } from './DecorativeControl';
import { PressableOpacity } from './Pressable';
import { ACCESSIBILITY_FONTSIZE_MULTIPLIER } from './Text';
import { type RadioIndicatorProps, type RadioProps } from './radioTypes';

type RadioStyleProps = {
    isChecked: boolean;
    isDisabled: boolean;
};

const RADIO_SIZE = 24 * ACCESSIBILITY_FONTSIZE_MULTIPLIER;
const RADIO_CHECK_SIZE = 14 * ACCESSIBILITY_FONTSIZE_MULTIPLIER;

const radioStyle = prepareNativeStyle<RadioStyleProps>(
    ({ colors, borders }, { isChecked, isDisabled }) => {
        const borderColor = (() => {
            if (isChecked && isDisabled) return colors.elementFillFieldSelectedDisabled;
            if (isChecked) return colors.elementFillFieldSelected;
            if (isDisabled) return colors.elementBorderFieldDisabled;

            return colors.elementBorderField;
        })();

        const backgroundColor = (() => {
            if (isChecked) return 'transparent';
            if (isDisabled) return colors.elementFillFieldDisabled;

            return colors.elementFillField;
        })();

        return {
            height: RADIO_SIZE,
            width: RADIO_SIZE,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: borders.radii.round,
            borderWidth: borders.widths.large,
            backgroundColor,
            borderColor,
        };
    },
);

const radioCheckStyle = prepareNativeStyle<Pick<RadioStyleProps, 'isDisabled'>>(
    (utils, { isDisabled }) => ({
        height: RADIO_CHECK_SIZE,
        width: RADIO_CHECK_SIZE,
        borderRadius: utils.borders.radii.round,
        backgroundColor: isDisabled
            ? utils.colors.elementFillFieldSelectedDisabled
            : utils.colors.elementFillFieldSelected,
    }),
);

export const LegacyRadio = <TValue extends string | number>({
    value,
    onPress,
    style,
    isChecked = false,
    isDisabled = false,
    disabled = isDisabled,
    ...props
}: RadioProps<TValue>) => {
    const { applyStyle } = useNativeStyles();

    return (
        <PressableOpacity
            disabled={disabled}
            onPress={() => {
                if (!disabled) onPress(value);
            }}
            accessibilityRole="radio"
            accessibilityState={{ checked: isChecked, selected: isChecked, disabled }}
            style={[applyStyle(radioStyle, { isChecked, isDisabled }), style]}
            {...props}
        >
            {isChecked && <View style={applyStyle(radioCheckStyle, { isDisabled })} />}
        </PressableOpacity>
    );
};

export const LegacyRadioIndicator = ({
    isChecked = false,
    isDisabled = false,
    style,
    testID,
}: RadioIndicatorProps) => {
    const { applyStyle } = useNativeStyles();

    return (
        <View testID={testID} style={style}>
            <DecorativeControl>
                <View style={applyStyle(radioStyle, { isChecked, isDisabled })}>
                    {isChecked && <View style={applyStyle(radioCheckStyle, { isDisabled })} />}
                </View>
            </DecorativeControl>
        </View>
    );
};

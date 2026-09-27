import { View } from 'react-native';

import { Host, RadioButton } from '@expo/ui/jetpack-compose';
import { testID as nativeTestID } from '@expo/ui/jetpack-compose/modifiers';

import { isDarkColor, useNativeStyles } from '@trezor/styles-native';

import { AndroidToggleAccessibility } from './AndroidToggleAccessibility';
import { DecorativeControl } from './DecorativeControl';
import { LegacyRadio } from './LegacyRadio';
import { isNativeRadioSupported } from './isNativeRadioSupported';
import { type RadioIndicatorProps, type RadioProps } from './radioTypes';

export type { RadioIndicatorProps, RadioProps } from './radioTypes';

const NativeRadio = <TValue extends string | number>({
    value,
    onPress,
    isChecked = false,
    isDisabled = false,
    disabled = isDisabled,
    accessibilityLabel,
    testID,
    style,
}: RadioProps<TValue>) => {
    const {
        utils: { colors },
    } = useNativeStyles();

    const handlePress = () => {
        if (!disabled) onPress(value);
    };

    return (
        <View style={style}>
            <AndroidToggleAccessibility
                accessibilityLabel={accessibilityLabel}
                testID={testID}
                role="radio"
                isChecked={isChecked}
                isDisabled={disabled}
                onChange={handlePress}
            >
                <Host
                    matchContents
                    colorScheme={isDarkColor(colors.surfaceFillPage) ? 'dark' : 'light'}
                    seedColor={colors.elementFillFieldSelected}
                    ignoreSafeAreaKeyboardInsets
                >
                    <RadioButton
                        selected={isChecked}
                        enabled={!disabled}
                        onClick={handlePress}
                        colors={{ selectedColor: colors.elementFillFieldSelected }}
                        modifiers={testID && !accessibilityLabel ? [nativeTestID(testID)] : []}
                    />
                </Host>
            </AndroidToggleAccessibility>
        </View>
    );
};

export const Radio = <TValue extends string | number>(props: RadioProps<TValue>) =>
    isNativeRadioSupported(props) ? <NativeRadio {...props} /> : <LegacyRadio {...props} />;

export const RadioIndicator = ({
    isChecked = false,
    isDisabled = false,
    testID,
    style,
}: RadioIndicatorProps) => {
    const {
        utils: { colors },
    } = useNativeStyles();

    return (
        <View style={style} testID={testID}>
            <DecorativeControl>
                <Host
                    matchContents
                    colorScheme={isDarkColor(colors.surfaceFillPage) ? 'dark' : 'light'}
                    seedColor={colors.elementFillFieldSelected}
                    ignoreSafeAreaKeyboardInsets
                >
                    <RadioButton
                        selected={isChecked}
                        enabled={!isDisabled}
                        colors={{ selectedColor: colors.elementFillFieldSelected }}
                    />
                </Host>
            </DecorativeControl>
        </View>
    );
};

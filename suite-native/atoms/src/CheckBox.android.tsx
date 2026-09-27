import { View } from 'react-native';

import { Checkbox, Host } from '@expo/ui/jetpack-compose';
import { testID as nativeTestID } from '@expo/ui/jetpack-compose/modifiers';

import { isDarkColor, useNativeStyles } from '@trezor/styles-native';

import { AndroidToggleAccessibility } from './AndroidToggleAccessibility';
import { type CheckBoxProps } from './CheckBox';

export type { CheckBoxProps } from './CheckBox';

export const CheckBox = ({
    isChecked,
    isDisabled = false,
    onChange,
    style,
    testID,
    accessibilityLabel,
}: CheckBoxProps) => {
    const {
        utils: { colors },
    } = useNativeStyles();

    const handleChange = (value: boolean) => {
        if (!isDisabled) {
            onChange(value);
        }
    };

    return (
        <View style={style}>
            <AndroidToggleAccessibility
                accessibilityLabel={accessibilityLabel}
                testID={testID}
                role="checkbox"
                isChecked={isChecked}
                isDisabled={isDisabled}
                onChange={onChange}
            >
                <Host
                    matchContents
                    colorScheme={isDarkColor(colors.surfaceFillPage) ? 'dark' : 'light'}
                    seedColor={colors.elementFillFieldSelected}
                    ignoreSafeAreaKeyboardInsets
                >
                    <Checkbox
                        value={isChecked}
                        onCheckedChange={handleChange}
                        enabled={!isDisabled}
                        colors={{ checkedColor: colors.elementFillFieldSelected }}
                        modifiers={testID && !accessibilityLabel ? [nativeTestID(testID)] : []}
                    />
                </Host>
            </AndroidToggleAccessibility>
        </View>
    );
};

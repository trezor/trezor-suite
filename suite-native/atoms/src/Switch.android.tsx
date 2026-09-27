import { Switch as ComposeSwitch, Host } from '@expo/ui/jetpack-compose';
import { testID as nativeTestID } from '@expo/ui/jetpack-compose/modifiers';

import { isDarkColor, useNativeStyles } from '@trezor/styles-native';

import { AndroidToggleAccessibility } from './AndroidToggleAccessibility';
import { type SwitchProps } from './Switch';

export type { SwitchProps } from './Switch';

export const Switch = ({
    isChecked,
    onChange,
    isDisabled = false,
    testID,
    accessibilityLabel,
}: SwitchProps) => {
    const {
        utils: { colors },
    } = useNativeStyles();

    const handleChange = (value: boolean) => {
        if (!isDisabled) {
            onChange(value);
        }
    };

    return (
        <AndroidToggleAccessibility
            accessibilityLabel={accessibilityLabel}
            testID={testID}
            role="switch"
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
                <ComposeSwitch
                    value={isChecked}
                    onCheckedChange={handleChange}
                    enabled={!isDisabled}
                    colors={{ checkedTrackColor: colors.elementFillFieldSelected }}
                    modifiers={testID && !accessibilityLabel ? [nativeTestID(testID)] : []}
                />
            </Host>
        </AndroidToggleAccessibility>
    );
};

import { Host, Toggle } from '@expo/ui/swift-ui';
import {
    disabled,
    fixedSize,
    frame,
    labelsHidden,
    accessibilityLabel as nativeAccessibilityLabel,
    toggleStyle,
} from '@expo/ui/swift-ui/modifiers';

import { isDarkColor, useNativeStyles } from '@trezor/styles-native';

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
        <Host
            matchContents
            colorScheme={isDarkColor(colors.surfaceFillPage) ? 'dark' : 'light'}
            seedColor={colors.elementFillFieldSelected}
            ignoreSafeArea="all"
        >
            <Toggle
                isOn={isChecked}
                onIsOnChange={handleChange}
                testID={testID}
                modifiers={[
                    toggleStyle('switch'),
                    labelsHidden(),
                    fixedSize(),
                    frame({ minHeight: 44 }),
                    disabled(isDisabled),
                    ...(accessibilityLabel ? [nativeAccessibilityLabel(accessibilityLabel)] : []),
                ]}
            />
        </Host>
    );
};

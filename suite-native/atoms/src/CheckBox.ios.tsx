import { View } from 'react-native';

import { Host, Image, Toggle } from '@expo/ui/swift-ui';
import {
    accessibilityHidden,
    buttonStyle,
    contentShape,
    disabled,
    font,
    frame,
    accessibilityLabel as nativeAccessibilityLabel,
    shapes,
    toggleStyle,
} from '@expo/ui/swift-ui/modifiers';

import { isDarkColor, useNativeStyles } from '@trezor/styles-native';

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

    const enabledColor = isChecked ? colors.elementFillFieldSelected : colors.contentSecondary;

    return (
        <View style={style}>
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
                        toggleStyle('button'),
                        buttonStyle('plain'),
                        disabled(isDisabled),
                        ...(accessibilityLabel
                            ? [nativeAccessibilityLabel(accessibilityLabel)]
                            : []),
                    ]}
                >
                    <Image
                        systemName={isChecked ? 'checkmark.circle.fill' : 'circle'}
                        color={isDisabled ? colors.contentDisabled : enabledColor}
                        modifiers={[
                            font({ textStyle: 'title2' }),
                            frame({ minWidth: 44, minHeight: 44 }),
                            contentShape(shapes.rectangle()),
                            accessibilityHidden(),
                        ]}
                    />
                </Toggle>
            </Host>
        </View>
    );
};

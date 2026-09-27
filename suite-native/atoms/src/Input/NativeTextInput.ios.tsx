import { Host, Text, TextField, VStack, useNativeState } from '@expo/ui/swift-ui';
import {
    accessibilityHidden,
    accessibilityLabel,
    autocorrectionDisabled,
    disabled,
    font,
    foregroundStyle,
    frame,
    keyboardType,
    textFieldStyle,
    textInputAutocapitalization,
    tint,
} from '@expo/ui/swift-ui/modifiers';

import { isDarkColor, useNativeStyles } from '@trezor/styles-native';

import { type NativeTextInputProps } from './nativeTextInputTypes';
import { useNativeTextInput } from './useNativeTextInput';

const keyboardTypeMap = {
    default: 'default',
    url: 'url',
    'email-address': 'email-address',
    'number-pad': 'numeric',
    'decimal-pad': 'decimal-pad',
} as const satisfies Record<
    NonNullable<NativeTextInputProps['keyboardType']>,
    Parameters<typeof keyboardType>[0]
>;

export const NativeTextInput = (props: NativeTextInputProps) => {
    const {
        value,
        label,
        placeholder,
        keyboardType: inputKeyboardType = 'default',
        autoCapitalize = 'sentences',
        autoCorrect = true,
        editable = true,
        hasError = false,
        autoFocus,
        maxLength,
        testID,
    } = props;
    const { utils } = useNativeStyles();
    const text = useNativeState(value);
    const { handleTextChange, handleFocusChange } = useNativeTextInput(props, text);

    return (
        <Host
            matchContents={{ vertical: true }}
            colorScheme={isDarkColor(utils.colors.surfaceFillPage) ? 'dark' : 'light'}
            ignoreSafeArea="all"
            style={{ alignSelf: 'stretch' }}
        >
            <VStack alignment="leading" spacing={6}>
                <Text
                    modifiers={[
                        font({ textStyle: 'subheadline' }),
                        foregroundStyle(utils.colors.contentSecondary),
                        accessibilityHidden(true),
                    ]}
                >
                    {label}
                </Text>
                <TextField
                    text={text}
                    placeholder={placeholder}
                    axis="horizontal"
                    // eslint-disable-next-line jsx-a11y/no-autofocus
                    autoFocus={autoFocus}
                    maxLength={maxLength}
                    onTextChange={handleTextChange}
                    onFocusChange={handleFocusChange}
                    testID={testID}
                    modifiers={[
                        textFieldStyle('roundedBorder'),
                        font({ textStyle: 'body' }),
                        frame({ maxWidth: Infinity, minHeight: 44 }),
                        keyboardType(keyboardTypeMap[inputKeyboardType]),
                        textInputAutocapitalization(
                            autoCapitalize === 'none' ? 'never' : autoCapitalize,
                        ),
                        autocorrectionDisabled(!autoCorrect),
                        disabled(!editable),
                        accessibilityLabel(label),
                        tint(hasError ? utils.colors.contentCritical : utils.colors.contentBrand),
                    ]}
                />
            </VStack>
        </Host>
    );
};

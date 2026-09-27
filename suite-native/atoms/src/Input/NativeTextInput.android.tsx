import { Host, OutlinedTextField, Text, useNativeState } from '@expo/ui/jetpack-compose';
import { fillMaxWidth, testID as nativeTestID } from '@expo/ui/jetpack-compose/modifiers';

import { isDarkColor, useNativeStyles } from '@trezor/styles-native';

import { type NativeTextInputProps } from './nativeTextInputTypes';
import { useNativeTextInput } from './useNativeTextInput';

const keyboardTypeMap = {
    default: 'text',
    url: 'uri',
    'email-address': 'email',
    'number-pad': 'number',
    'decimal-pad': 'decimal',
} as const;

export const NativeTextInput = (props: NativeTextInputProps) => {
    const {
        value,
        label,
        placeholder,
        keyboardType = 'default',
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
            seedColor={utils.colors.contentBrand}
            ignoreSafeAreaKeyboardInsets
            style={{ alignSelf: 'stretch' }}
        >
            <OutlinedTextField
                value={text}
                singleLine
                enabled={editable}
                isError={hasError}
                // eslint-disable-next-line jsx-a11y/no-autofocus
                autoFocus={autoFocus}
                maxLength={maxLength}
                onValueChange={handleTextChange}
                onFocusChanged={handleFocusChange}
                keyboardOptions={{
                    keyboardType: keyboardTypeMap[keyboardType],
                    capitalization: autoCapitalize,
                    autoCorrectEnabled: autoCorrect,
                }}
                modifiers={[fillMaxWidth(), ...(testID ? [nativeTestID(testID)] : [])]}
            >
                <OutlinedTextField.Label>
                    <Text>{label}</Text>
                </OutlinedTextField.Label>
                {!!placeholder && (
                    <OutlinedTextField.Placeholder>
                        <Text>{placeholder}</Text>
                    </OutlinedTextField.Placeholder>
                )}
            </OutlinedTextField>
        </Host>
    );
};

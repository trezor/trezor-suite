import { InputWrapper, NativeTextInput, type NativeTextInputProps } from '@suite-native/atoms';

import { TextInputField } from './TextInputField';
import { useField } from '../hooks/useField';
import { type FieldName } from '../types';

export type NativeTextInputFieldProps = Omit<NativeTextInputProps, 'value' | 'hasError'> & {
    name: FieldName;
    hint?: string;
    defaultValue?: string;
    valueTransformer?: (value: string) => string;
};

const UntransformedNativeTextInputField = ({
    name,
    hint,
    defaultValue = '',
    onBlur,
    onChangeText,
    ...props
}: Omit<NativeTextInputFieldProps, 'valueTransformer'>) => {
    const {
        errorMessage,
        onBlur: fieldOnBlur,
        onChange,
        value,
        hasError,
    } = useField({
        name,
        defaultValue,
    });

    return (
        <InputWrapper error={errorMessage} hint={hint}>
            <NativeTextInput
                {...props}
                value={value}
                hasError={hasError}
                onBlur={() => {
                    fieldOnBlur();
                    onBlur?.();
                }}
                onChangeText={text => {
                    onChange(text);
                    onChangeText?.(text);
                }}
            />
        </InputWrapper>
    );
};

export const NativeTextInputField = ({ valueTransformer, ...props }: NativeTextInputFieldProps) => {
    // Formatting on JS can overwrite a composing IME buffer. Keep existing transformed fields on RN.
    if (valueTransformer) {
        return (
            <TextInputField
                {...props}
                valueTransformer={valueTransformer}
                labelType="outsideLabel"
                accessibilityLabel={props.label}
            />
        );
    }

    return <UntransformedNativeTextInputField {...props} />;
};

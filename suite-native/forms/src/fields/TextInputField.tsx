import { forwardRef } from 'react';

import { TextInput } from 'react-native/types';

import { Input, InputWrapper, InputProps, InputWrapperProps } from '@suite-native/atoms';

import { useField } from '../hooks/useField';
import { FieldName } from '../types';

type AllowedTextInputFieldProps = Omit<
    Partial<InputProps>,
    keyof ReturnType<typeof useField> | 'defaultValue'
>;
type AllowedInputWrapperProps = Pick<InputWrapperProps, 'hint'>;
export interface FieldProps extends AllowedTextInputFieldProps, AllowedInputWrapperProps {
    name: FieldName;
    label: string;
    onBlur?: () => void;
    defaultValue?: string;
    valueTransformer?: (value: string) => string;
}

const SECURE_TEXT_PROPS: Partial<FieldProps> = {
    secureTextEntry: true,
    importantForAutofill: 'no',
    autoComplete: 'off',
    textContentType: 'oneTimeCode',
};

export const TextInputField = forwardRef<TextInput, FieldProps>(
    (
        {
            name,
            label,
            hint,
            onBlur,
            defaultValue = '',
            valueTransformer,
            secureTextEntry,
            importantForAutofill,
            autoComplete,
            textContentType,
            ...otherProps
        },
        ref,
    ) => {
        const field = useField({ name, label, defaultValue, valueTransformer });
        const { errorMessage, onBlur: hookFormOnBlur, onChange, value, hasError } = field;

        const handleOnBlur = () => {
            hookFormOnBlur();
            if (onBlur) {
                onBlur();
            }
        };

        return (
            <InputWrapper error={errorMessage} hint={hint}>
                <Input
                    {...otherProps}
                    onBlur={handleOnBlur}
                    onChangeText={onChange}
                    value={value}
                    hasError={hasError}
                    label={label}
                    ref={ref}
                    // We want to prevent secure inputs from interacting with any password managers and autofill.
                    // Passphrases or other crypto secrets should be never saved anywhere!
                    {...(secureTextEntry ? SECURE_TEXT_PROPS : {})}
                />
            </InputWrapper>
        );
    },
);

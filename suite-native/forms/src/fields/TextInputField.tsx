import React from 'react';

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
    defaultValue?: string;
}

export const TextInputField = ({
    name,
    label,
    hint,
    defaultValue = '',
    ...otherProps
}: FieldProps) => {
    const field = useField({ name, label, defaultValue });
    const { errorMessage, onBlur, onChange, value, hasError } = field;

    return (
        <InputWrapper error={errorMessage} hint={hint}>
            <Input
                {...otherProps}
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                hasError={hasError}
                label={label}
            />
        </InputWrapper>
    );
};

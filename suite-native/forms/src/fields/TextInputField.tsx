import React from 'react';

import { Input, InputWrapper, InputProps, InputWrapperProps } from '@suite-native/atoms';

import { useField } from '../hooks/useField';
import { FieldName } from '../types';

export interface FieldProps extends Partial<InputProps>, Pick<InputWrapperProps, 'hint'> {
    name: FieldName;
    label: string;
}

export const TextInputField = ({ name, label, hint, ...otherProps }: FieldProps) => {
    const field = useField({ name, label });
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

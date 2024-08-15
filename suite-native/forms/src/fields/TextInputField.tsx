import { forwardRef } from 'react';

import { TextInput } from 'react-native/types';
import { RequireOneOrNone } from 'type-fest';

import { Input, InputWrapper, InputProps, InputWrapperProps } from '@suite-native/atoms';

import { useField } from '../hooks/useField';
import { FieldName } from '../types';

type AllowedTextInputFieldProps = Omit<
    Partial<InputProps>,
    keyof ReturnType<typeof useField> | 'defaultValue'
>;
type AllowedInputWrapperProps = Pick<InputWrapperProps, 'hint'>;
export type FieldProps = AllowedTextInputFieldProps &
    AllowedInputWrapperProps &
    RequireOneOrNone<
        {
            name: FieldName;
            label?: string;
            placeholder?: string;
            onBlur?: () => void;
            defaultValue?: string;
            valueTransformer?: (value: string) => string;
        },
        'label' | 'placeholder'
    >;

export const TextInputField = forwardRef<TextInput, FieldProps>(
    ({ name, hint, onBlur, defaultValue = '', valueTransformer, ...otherProps }, ref) => {
        const field = useField({
            name,
            defaultValue,
            valueTransformer,
            // Accessing `label` from destructured props does break the `RequireOneOrNone` validation of `Input` props.
            label: otherProps.label,
        });
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
                    ref={ref}
                />
            </InputWrapper>
        );
    },
);

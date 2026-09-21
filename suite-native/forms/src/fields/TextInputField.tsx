import { forwardRef } from 'react';

import { type RequireOneOrNone } from 'type-fest';

import {
    Input,
    type InputLabelVariantProps,
    type InputProps,
    type InputType,
    InputWrapper,
    type InputWrapperProps,
} from '@suite-native/atoms';

import { CopyButton } from '../components/CopyButton';
import { useField } from '../hooks/useField';
import { type FieldName } from '../types';

type AllowedTextInputFieldProps = Omit<
    Partial<InputProps>,
    keyof ReturnType<typeof useField> | 'defaultValue' | 'label' | 'placeholder' | 'labelType'
>;
type AllowedInputWrapperProps = Pick<InputWrapperProps, 'hint'>;

export type FieldProps = RequireOneOrNone<
    AllowedTextInputFieldProps &
        AllowedInputWrapperProps &
        InputLabelVariantProps & {
            name: FieldName;
            onBlur?: () => void;
            defaultValue?: string;
            valueTransformer?: (value: string) => string;
            showCopyButton?: boolean;
        },
    'rightIcon' | 'showCopyButton'
>;

export const TextInputField = forwardRef<InputType, FieldProps>(
    (
        {
            name,
            hint,
            label,
            readOnly,
            placeholder,
            onBlur,
            valueTransformer,
            onChangeText,
            defaultValue = '',
            labelType = 'innerLabel',
            rightIcon,
            showCopyButton = false,
            ...otherProps
        },
        ref,
    ) => {
        const field = useField({
            name,
            defaultValue,
            valueTransformer,
        });
        const { errorMessage, onBlur: hookFormOnBlur, onChange, value, hasError } = field;

        const handleOnBlur = () => {
            hookFormOnBlur();
            onBlur?.();
        };

        const handleOnChange = (text: string) => {
            onChange(text);
            onChangeText?.(text);
        };

        const innerLabelOrPlaceholderProps =
            labelType === 'innerLabel' ? { labelType, label } : { labelType, placeholder };
        const wrapperLabel = labelType === 'outsideLabel' ? label : undefined;

        return (
            <InputWrapper error={errorMessage} hint={hint} label={wrapperLabel}>
                <Input
                    {...otherProps}
                    {...innerLabelOrPlaceholderProps}
                    ref={ref}
                    // Forces a native layout reset of multiline read-only inputs after form is cleared.
                    key={readOnly && !value ? 'read-only-empty' : null}
                    onBlur={handleOnBlur}
                    onChangeText={handleOnChange}
                    value={value}
                    readOnly={readOnly}
                    hasError={hasError}
                    rightIcon={showCopyButton ? <CopyButton value={value} /> : rightIcon}
                />
            </InputWrapper>
        );
    },
);

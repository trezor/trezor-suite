import { InputWrapper, Select, type SelectItemValue, type SelectProps } from '@suite-native/atoms';

import { useField } from '../hooks/useField';
import { type FieldName } from '../types';

type SelectFieldProps<TItemValue extends SelectItemValue> = SelectProps<TItemValue> & {
    name: FieldName;
};

export const SelectField = <TItemValue extends SelectItemValue>({
    name,
    ...otherProps
}: SelectFieldProps<TItemValue>) => {
    const field = useField({ name });
    const { errorMessage, hasError } = field;

    return (
        <InputWrapper error={errorMessage}>
            <Select<TItemValue> hasError={hasError} {...otherProps} />
        </InputWrapper>
    );
};

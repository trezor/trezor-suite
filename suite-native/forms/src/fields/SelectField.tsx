import { InputWrapper, Select, type SelectItemValue, type SelectProps } from '@suite-native/atoms';

import { useField } from '../hooks/useField';
import { type FieldName } from '../types';

type SelectFieldProps<TItemValue extends SelectItemValue> = SelectProps<TItemValue> & {
    name: FieldName;
};

export const SelectField = <TItemValue extends SelectItemValue>({
    name,
    title,
    isLabelShown,
    ...otherProps
}: SelectFieldProps<TItemValue>) => {
    const field = useField({ name });
    const { errorMessage, hasError } = field; // TODO: use value from fieldState
    const wrapperLabel = !isLabelShown ? title : undefined;

    return (
        <InputWrapper error={errorMessage} label={wrapperLabel}>
            <Select<TItemValue>
                title={title}
                isLabelShown={isLabelShown}
                hasError={hasError}
                {...otherProps}
            />
        </InputWrapper>
    );
};

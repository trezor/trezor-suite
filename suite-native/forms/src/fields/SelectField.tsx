import { InputWrapper, Select, type SelectItemValue, type SelectProps } from '@suite-native/atoms';

import { useField } from '../hooks/useField';
import { type FieldName } from '../types';

type SelectFieldProps<TItemValue extends SelectItemValue> = {
    name: FieldName;
    labelType?: 'innerLabel' | 'outsideLabel' | 'noLabel';
} & Omit<SelectProps<TItemValue>, 'value' | 'isLabelShown'>;

export const SelectField = <TItemValue extends SelectItemValue>({
    name,
    title,
    labelType,
    ...otherProps
}: SelectFieldProps<TItemValue>) => {
    const field = useField({ name });
    const { errorMessage, hasError, value } = field;

    const wrapperLabel = labelType === 'outsideLabel' ? title : undefined;

    return (
        <InputWrapper error={errorMessage} label={wrapperLabel}>
            <Select<TItemValue>
                {...otherProps}
                title={title}
                value={value as TItemValue}
                isLabelShown={labelType === 'innerLabel'}
                hasError={hasError}
            />
        </InputWrapper>
    );
};

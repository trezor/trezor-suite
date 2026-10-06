import { InputWrapper, Select, type SelectItemValue, type SelectProps } from '@suite-native/atoms';

import { CopyButton } from '../components/CopyButton';
import { useField } from '../hooks/useField';
import { type FieldName } from '../types';

type SelectFieldProps<TItemValue extends SelectItemValue> = {
    name: FieldName;
    labelType?: 'innerLabel' | 'outsideLabel' | 'noLabel';
    showCopyButton?: boolean;
} & Omit<SelectProps<TItemValue>, 'value' | 'isLabelShown' | 'rightIcon'>;

export const SelectField = <TItemValue extends SelectItemValue>({
    name,
    title,
    labelType,
    showCopyButton = false,
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
                rightIcon={showCopyButton && <CopyButton value={value} />}
                hasError={hasError}
            />
        </InputWrapper>
    );
};

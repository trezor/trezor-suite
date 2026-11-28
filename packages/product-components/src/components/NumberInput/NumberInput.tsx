import { useCallback } from 'react';
import {
    type Control,
    type FieldValues,
    type UseControllerProps,
    useController,
} from 'react-hook-form';

import { NumberInputBase, type NumberInputBaseProps } from './NumberInputBase';

export type NumberInputProps<TFieldValues extends FieldValues> = Omit<
    NumberInputBaseProps,
    'name' | 'value' | 'onChange' | 'innerRef'
> &
    Omit<UseControllerProps<TFieldValues>, 'rules'> & {
        onChange?: (value: string) => void;
        rules?: UseControllerProps['rules'];
    };

export const NumberInput = <TFieldValues extends FieldValues>({
    name,
    rules,
    control,
    onChange: onChangeCallback,
    defaultValue,
    ...props
}: NumberInputProps<TFieldValues>) => {
    const {
        field: { value = '', onChange, ref, ...controlProps },
        fieldState: { invalid },
    } = useController({
        name,
        control: control as Control<FieldValues>,
        rules,
        defaultValue,
    });

    const handleChange = useCallback(
        (cleanInput: string) => {
            onChange(cleanInput);

            // get the latest error state
            const hasError =
                (typeof rules?.validate === 'function' && !!rules?.validate?.(cleanInput, {})) ||
                (typeof rules?.validate === 'object' &&
                    Object.values(rules.validate).some(validateFunction =>
                        validateFunction(cleanInput, {}),
                    ));
            // because the form is not updated yet after calling `onChange()`,
            // the value of `invalid` here is the one before this change has been handled
            const hasErrorStateChanged = hasError !== invalid;
            if (hasErrorStateChanged) {
                // delaying it because the form needs some time to update the error state
                // TODO: get rid of `onChangeCallback()` entirely and use the `watch` method from react-hook form
                setTimeout(() => {
                    onChangeCallback?.(cleanInput);
                }, 0);
            } else {
                onChangeCallback?.(cleanInput);
            }
        },
        [onChange, onChangeCallback, invalid, rules],
    );

    return (
        <NumberInputBase
            {...props}
            {...controlProps}
            value={value}
            onChange={handleChange}
            innerRef={ref}
        />
    );
};

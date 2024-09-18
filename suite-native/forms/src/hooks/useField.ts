import { useController } from 'react-hook-form';
import { useContext } from 'react';

import { G } from '@mobily/ts-belt';

import { FieldName } from '../types';
import { FormContext } from '../Form';

interface UseFieldArgs {
    name: FieldName;
    label?: string;
    defaultValue?: unknown;
    valueTransformer?: (value: string) => string;
}

export const useField = ({
    name,
    label,
    defaultValue,
    valueTransformer = value => value,
}: UseFieldArgs) => {
    // TODO: once react-hook-form is updated to 7+ we can use the `errors` from `fieldState` on useController
    const { control } = useContext(FormContext);

    if (!control) {
        throw new Error('Field must be used within Form component');
    }

    const {
        field: { onBlur, onChange, value },
        fieldState: { error, isDirty },
    } = useController({
        name,
        control,
        defaultValue,
    });

    // Inspired by https://react-hook-form.com/advanced-usage#TransformandParse.
    // Allows to parse/transform the value before it's set to the input.
    const transformedValue = G.isString(value) ? valueTransformer(value) : '';

    // TODO: proper error message resolution using intl
    const errorMessage = label ? error?.message?.replace(name, label) : error?.message;
    const hasError = !!error;

    return {
        errorMessage,
        hasError,
        isDirty,
        value: transformedValue,
        onBlur,
        onChange,
    };
};

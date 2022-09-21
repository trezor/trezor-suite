import { FieldError, useController } from 'react-hook-form';
import { useContext } from 'react';

import { FieldName } from '../types';
import { FormContext } from '../Form';

interface UseFieldArgs {
    name: FieldName;
    label: string;
    defaultValue?: unknown;
}

export const useField = ({ name, label, defaultValue }: UseFieldArgs) => {
    // TODO: once react-hook-form is updated to 7+ we can use the `errors` from `fieldState` on useController
    const { control, errors } = useContext(FormContext);

    if (!control || !errors) {
        throw new Error('Field must be used within Form component');
    }

    const error: FieldError | undefined = errors?.[name];
    // TODO: proper error message resolution using intl
    const errorMessage = error?.message?.replace(name, label);
    const hasError = !!error;
    const {
        field: { onBlur, onChange, value },
    } = useController({
        name,
        control,
        defaultValue,
    });

    return {
        errorMessage,
        hasError,
        value,
        onBlur,
        onChange,
    };
};

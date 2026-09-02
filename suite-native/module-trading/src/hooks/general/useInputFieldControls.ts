import { useCallback } from 'react';

import { useField } from '@suite-native/forms';

export const useInputFieldControls = <T extends string>(
    name: T,
    value: string | undefined,
    setValue: (field: 'focusedValue', value: T | undefined) => void,
) => {
    // do not use `value` from `useField` here, because it does not work properly with `undefined`
    const { onChange, onBlur, hasError } = useField({ name });

    const setFocusedValue = useCallback(() => {
        setValue('focusedValue', name);
    }, [name, setValue]);

    const clearFocusedValueAndBlur = useCallback(() => {
        onBlur();
        setValue('focusedValue', undefined);
    }, [onBlur, setValue]);

    return {
        value: value ?? '',
        hasError,
        onFocus: setFocusedValue,
        onBlur: clearFocusedValueAndBlur,
        onChangeText: onChange,
    };
};

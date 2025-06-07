import { useField } from '@suite-native/forms';

export const useInputFieldControls = <T extends string>(
    name: T,
    value: string | undefined,
    setValue: (field: 'focusedValue', value: T | undefined) => void,
) => {
    // do not use `value` from `useField` here, because it does not work properly with `undefined`
    const { onChange, onBlur, hasError } = useField({ name });

    const setFocusedValue = () => {
        setValue('focusedValue', name);
    };

    const clearFocusedValueAndBlur = () => {
        onBlur();
        setValue('focusedValue', undefined);
    };

    return {
        value: value ?? '',
        hasError,
        onFocus: setFocusedValue,
        onBlur: clearFocusedValueAndBlur,
        onChangeText: onChange,
    };
};

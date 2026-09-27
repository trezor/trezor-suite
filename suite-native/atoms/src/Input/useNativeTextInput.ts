import { useLayoutEffect, useRef } from 'react';

import { type NativeTextInputProps } from './nativeTextInputTypes';

type NativeTextState = {
    set: (value: string) => void;
};

export const useNativeTextInput = (
    { value, onChangeText, onFocus, onBlur }: NativeTextInputProps,
    text: NativeTextState,
) => {
    const lastNativeValue = useRef(value);
    const isFocused = useRef(false);

    useLayoutEffect(() => {
        // Echoing typing into the native buffer can reset its selection or IME composition.
        if (value !== lastNativeValue.current) {
            lastNativeValue.current = value;
            text.set(value);
        }
    }, [value, text]);

    const handleTextChange = (newValue: string) => {
        lastNativeValue.current = newValue;
        onChangeText?.(newValue);
    };

    const handleFocusChange = (focused: boolean) => {
        if (focused === isFocused.current) return;

        isFocused.current = focused;
        if (focused) onFocus?.();
        else onBlur?.();
    };

    return { handleTextChange, handleFocusChange };
};

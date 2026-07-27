import { type RefObject, useState } from 'react';
import { type TextInput } from 'react-native';

export const useSearchInputCallbacks = <T extends RefObject<TextInput | null>>(
    searchInputRef: T,
    onChange: (value: string) => void,
) => {
    const [isFocused, setIsFocused] = useState<boolean>(false);
    const [isClearButtonVisible, setIsClearButtonVisible] = useState<boolean>(false);

    const handleClear = () => {
        setIsClearButtonVisible(false);
        searchInputRef.current?.clear();
        onChange('');
    };

    const handleInputFocus = () => {
        searchInputRef.current?.focus();
    };

    const handleOnChangeText = (inputValue: string) => {
        setIsClearButtonVisible(!!inputValue.length);
        onChange(inputValue);
    };

    return {
        isFocused,
        setIsFocused,
        isClearButtonVisible,
        handleClear,
        handleInputFocus,
        handleOnChangeText,
    };
};

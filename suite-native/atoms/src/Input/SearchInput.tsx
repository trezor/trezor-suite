import { useRef } from 'react';
import { Pressable, TextInput } from 'react-native';

import { useNativeStyles } from '@trezor/styles';

import { Box } from '../Box';
import { SurfaceElevation } from '../types';
import { SearchInputClearButton } from './SearchInputClearButton';
import { SearchInputMagnifyingGlass } from './SearchInputMagnifyingGlass';
import { inputStyle, inputWrapperStyle } from './searchInputStyles';
import { useSearchInputCallbacks } from './useSearchInputCallbacks';

type InputProps = {
    onChange: (value: string) => void;
    placeholder?: string;
    isDisabled?: boolean;
    maxLength?: number;
    elevation?: SurfaceElevation;
};

export const SearchInput = ({
    onChange,
    placeholder,
    maxLength,
    isDisabled = false,
    elevation = '0',
}: InputProps) => {
    const { applyStyle, utils } = useNativeStyles();

    const searchInputRef = useRef<TextInput>(null);

    const {
        handleClear,
        handleInputFocus,
        handleOnChangeText,
        isFocused,
        isClearButtonVisible,
        setIsFocused,
    } = useSearchInputCallbacks(searchInputRef, onChange);

    return (
        <Pressable onPress={handleInputFocus}>
            <Box style={applyStyle(inputWrapperStyle, { isFocused, elevation })}>
                <SearchInputMagnifyingGlass />
                <TextInput
                    ref={searchInputRef}
                    onChangeText={handleOnChangeText}
                    placeholder={placeholder}
                    placeholderTextColor={utils.colors.textSubdued}
                    editable={!isDisabled}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    style={applyStyle(inputStyle)}
                    maxLength={maxLength}
                />
                <SearchInputClearButton onPress={handleClear} isVisible={isClearButtonVisible} />
            </Box>
        </Pressable>
    );
};

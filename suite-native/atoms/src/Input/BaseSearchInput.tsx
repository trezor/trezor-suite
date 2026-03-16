import { forwardRef } from 'react';
import { Pressable, TextInput } from 'react-native';

import { useNativeStyles } from '@trezor/styles';

import { Box } from '../Box';
import { type SurfaceElevation } from '../types';
import { SearchInputClearButton } from './SearchInputClearButton';
import { SearchInputMagnifyingGlass } from './SearchInputMagnifyingGlass';
import { inputStyle, inputWrapperStyle } from './searchInputStyles';
import { useSearchInputCallbacks } from './useSearchInputCallbacks';

export type BaseSearchInputProps = {
    onChange: (value: string) => void;
    placeholder?: string;
    isDisabled?: boolean;
    maxLength?: number;
    elevation?: SurfaceElevation;
    onFocus?: () => void;
    onBlur?: () => void;
};
export const BaseSearchInput = forwardRef<TextInput, BaseSearchInputProps>(
    (
        { onChange, placeholder, maxLength, isDisabled = false, elevation = '0', onFocus, onBlur },
        ref,
    ) => {
        const { applyStyle, utils } = useNativeStyles();

        const {
            handleClear,
            handleInputFocus,
            handleOnChangeText,
            isFocused,
            isClearButtonVisible,
            setIsFocused,
        } = useSearchInputCallbacks(ref as React.RefObject<TextInput | null>, onChange);

        return (
            <Pressable onPress={handleInputFocus}>
                <Box style={applyStyle(inputWrapperStyle, { isFocused, elevation })}>
                    <SearchInputMagnifyingGlass />

                    <TextInput
                        ref={ref}
                        onChangeText={handleOnChangeText}
                        placeholder={placeholder}
                        placeholderTextColor={utils.colors.textSubdued}
                        editable={!isDisabled}
                        onFocus={() => {
                            setIsFocused(true);
                            onFocus?.();
                        }}
                        onBlur={() => {
                            setIsFocused(false);
                            onBlur?.();
                        }}
                        style={applyStyle(inputStyle)}
                        maxLength={maxLength}
                    />

                    <SearchInputClearButton
                        onPress={handleClear}
                        isVisible={isClearButtonVisible}
                    />
                </Box>
            </Pressable>
        );
    },
);

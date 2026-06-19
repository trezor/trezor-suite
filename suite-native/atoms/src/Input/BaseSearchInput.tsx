import { forwardRef } from 'react';
import { Pressable, TextInput } from 'react-native';

import { useNativeStyles } from '@trezor/styles-native';

import { Box } from '../Box';
import { SearchInputClearButton } from './SearchInputClearButton';
import { SearchInputMagnifyingGlass } from './SearchInputMagnifyingGlass';
import { inputStyle, inputWrapperStyle } from './searchInputStyles';
import { useSearchInputCallbacks } from './useSearchInputCallbacks';

export type BaseSearchInputProps = {
    onChange: (value: string) => void;
    placeholder?: string;
    autoFocus?: boolean;
    isDisabled?: boolean;
    maxLength?: number;
    onFocus?: () => void;
    onBlur?: () => void;
};
export const BaseSearchInput = forwardRef<TextInput, BaseSearchInputProps>(
    ({ onChange, placeholder, maxLength, autoFocus, isDisabled = false, onFocus, onBlur }, ref) => {
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
                <Box style={applyStyle(inputWrapperStyle, { isFocused })}>
                    <SearchInputMagnifyingGlass />

                    <TextInput
                        ref={ref}
                        onChangeText={handleOnChangeText}
                        placeholder={placeholder}
                        placeholderTextColor={utils.colors.contentSecondary}
                        // eslint-disable-next-line jsx-a11y/no-autofocus
                        autoFocus={autoFocus}
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

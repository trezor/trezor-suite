import { forwardRef, useImperativeHandle, useRef } from 'react';
import { Pressable } from 'react-native';
import { TextInput } from 'react-native-gesture-handler';

import { BottomSheetTextInput } from '@gorhom/bottom-sheet';

import { useNativeStyles } from '@trezor/styles';

import { Box } from '../Box';
import { SurfaceElevation } from '../types';
import { SearchInputClearButton } from './SearchInputClearButton';
import { SearchInputMagnifyingGlass } from './SearchInputMagnifyingGlass';
import { inputStyle, inputWrapperStyle } from './searchInputStyles';
import { useSearchInputCallbacks } from './useSearchInputCallbacks';

export type BottomSheetSearchInputProps = {
    onChange: (value: string) => void;
    placeholder?: string;
    isDisabled?: boolean;
    maxLength?: number;
    elevation?: SurfaceElevation;
    onFocus?: () => void;
    onBlur?: () => void;
    value?: string;
    autoCorrect?: boolean;
};

export type BottomSheetSearchInputRef = TextInput;

const noOp = () => {};

export const BottomSheetSearchInput = forwardRef<
    BottomSheetSearchInputRef,
    BottomSheetSearchInputProps
>(
    (
        {
            onChange,
            placeholder,
            maxLength,
            isDisabled = false,
            elevation = '0',
            onFocus = noOp,
            onBlur = noOp,
            value,
            autoCorrect,
        },
        ref,
    ) => {
        const { applyStyle, utils } = useNativeStyles();

        const searchInputRef = useRef<BottomSheetSearchInputRef>(null);

        const {
            handleClear,
            handleInputFocus,
            handleOnChangeText,
            isFocused,
            isClearButtonVisible,
            setIsFocused,
        } = useSearchInputCallbacks(searchInputRef, onChange);

        useImperativeHandle(ref, () => searchInputRef.current!, [searchInputRef]);

        return (
            <Pressable onPress={handleInputFocus}>
                <Box style={applyStyle(inputWrapperStyle, { isFocused, elevation })}>
                    <SearchInputMagnifyingGlass />
                    <BottomSheetTextInput
                        ref={searchInputRef}
                        onChangeText={handleOnChangeText}
                        placeholder={placeholder}
                        accessibilityLabel={placeholder}
                        placeholderTextColor={utils.colors.textSubdued}
                        editable={!isDisabled}
                        onFocus={() => {
                            setIsFocused(true);
                            onFocus();
                        }}
                        onBlur={() => {
                            setIsFocused(false);
                            onBlur();
                        }}
                        style={applyStyle(inputStyle)}
                        maxLength={maxLength}
                        value={value}
                        autoCorrect={autoCorrect}
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

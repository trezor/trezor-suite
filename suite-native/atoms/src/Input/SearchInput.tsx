import React, { useState, useRef } from 'react';
import { Pressable, TextInput, TouchableOpacity } from 'react-native';

import { Icon } from '@trezor/icons';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { Box } from '../Box';

type InputProps = {
    value: string;
    onChange: (value: string) => void;
    placeholder: string;
    isDisabled?: boolean;
};

const inputStyle = prepareNativeStyle(utils => ({
    ...utils.typography.body,
    flex: 1,
    color: utils.colors.gray700,
    marginLeft: utils.spacings.medium,
    lineHeight: 0,
}));

const clearIconStyle = prepareNativeStyle(utils => ({
    backgroundColor: utils.colors.gray500,
    height: 20,
    width: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: utils.borders.radii.round,
}));

type InputStyleProps = {
    isFocused: boolean;
};
const inputWrapperStyle = prepareNativeStyle<InputStyleProps>((utils, { isFocused }) => ({
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 48,
    borderWidth: utils.borders.widths.small,
    borderColor: utils.colors.gray200,
    backgroundColor: utils.colors.gray200,
    borderRadius: utils.borders.radii.small,
    paddingLeft: 14,
    paddingRight: 14.25,
    extend: [
        {
            condition: isFocused,
            style: {
                borderColor: utils.colors.gray500,
            },
        },
    ],
}));

export const SearchInput = ({ value, onChange, placeholder, isDisabled = false }: InputProps) => {
    const { applyStyle, utils } = useNativeStyles();
    const [isFocused, setIsFocused] = useState<boolean>(false);
    const searchInputRef = useRef<TextInput | null>(null);
    const isClearButtonVisible = !!value.length;
    const handleClear = () => {
        onChange('');
    };

    const handleInputFocus = () => {
        searchInputRef?.current?.focus();
    };

    return (
        <Pressable onPress={handleInputFocus}>
            <Box style={applyStyle(inputWrapperStyle, { isFocused })}>
                <Box>
                    <Icon name="search" color="gray600" />
                </Box>
                <TextInput
                    ref={searchInputRef}
                    value={value}
                    onChangeText={onChange}
                    placeholder={placeholder}
                    placeholderTextColor={utils.colors.gray700}
                    editable={!isDisabled}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    style={applyStyle(inputStyle)}
                />
                {isClearButtonVisible && (
                    <TouchableOpacity onPress={handleClear} style={applyStyle(clearIconStyle)}>
                        <Icon name="close" size="small" color="white" />
                    </TouchableOpacity>
                )}
            </Box>
        </Pressable>
    );
};

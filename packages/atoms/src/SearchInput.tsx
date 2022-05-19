import React, { useState, useRef } from 'react';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { TextInput, TouchableOpacity, TouchableWithoutFeedback } from 'react-native';
import { Icon } from './Icon/Icon';
import { Box } from './Box';

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
    marginLeft: utils.spacings.md,
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
    borderWidth: utils.borders.widths.sm,
    borderColor: utils.colors.gray200,
    backgroundColor: utils.colors.gray200,
    borderRadius: utils.borders.radii.basic,
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
    const { applyStyle } = useNativeStyles();
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
        <TouchableWithoutFeedback onPress={handleInputFocus}>
            <Box style={applyStyle(inputWrapperStyle, { isFocused })}>
                <Box>
                    <Icon type="search" color="gray600" />
                </Box>
                <TextInput
                    ref={searchInputRef}
                    value={value}
                    onChangeText={onChange}
                    placeholder={placeholder}
                    editable={!isDisabled}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    style={applyStyle(inputStyle)}
                />
                {isClearButtonVisible && (
                    <TouchableOpacity onPress={handleClear} style={applyStyle(clearIconStyle)}>
                        <Icon type="close" size="small" color="white" />
                    </TouchableOpacity>
                )}
            </Box>
        </TouchableWithoutFeedback>
    );
};

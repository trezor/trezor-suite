import { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { Pressable, TextInput, TouchableOpacity } from 'react-native';

import { Icon } from '@suite-native/icons';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { Box } from '../Box';
import { SurfaceElevation } from '../types';

export type SearchInputProps = {
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

const inputStyle = prepareNativeStyle(utils => ({
    ...utils.typography.body,
    flex: 1,
    color: utils.colors.textOnTertiary,
    marginLeft: utils.spacings.sp16,
    lineHeight: 0,
}));

type InputStyleProps = {
    isFocused: boolean;
    elevation: SurfaceElevation;
};

const inputWrapperStyle = prepareNativeStyle<InputStyleProps>(
    (utils, { isFocused, elevation }) => ({
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        height: 48,
        borderWidth: utils.borders.widths.small,
        borderRadius: utils.borders.radii.r8,
        borderColor: utils.colors.backgroundNeutralSubtleOnElevation0,
        backgroundColor: utils.colors.backgroundNeutralSubtleOnElevation0,
        paddingLeft: 14,
        paddingRight: 14.25,
        extend: [
            {
                condition: isFocused,
                style: {
                    borderColor: utils.colors.borderFocus,
                },
            },
            {
                condition: elevation === '1',
                style: {
                    borderColor: utils.colors.backgroundNeutralSubtleOnElevation1,
                    backgroundColor: utils.colors.backgroundNeutralSubtleOnElevation1,
                },
            },
        ],
    }),
);

const noOp = () => {};

export const SearchInput = forwardRef<TextInput, SearchInputProps>(
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
        const [isFocused, setIsFocused] = useState<boolean>(false);
        const [isClearButtonVisible, setIsClearButtonVisible] = useState<boolean>(false);
        const searchInputRef = useRef<TextInput>(null);

        useImperativeHandle(ref, () => searchInputRef.current!, [searchInputRef]);

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

        return (
            <Pressable onPress={handleInputFocus}>
                <Box style={applyStyle(inputWrapperStyle, { isFocused, elevation })}>
                    <Icon name="magnifyingGlass" color="iconSubdued" size="large" />
                    <TextInput
                        ref={searchInputRef}
                        onChangeText={handleOnChangeText}
                        placeholder={placeholder}
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
                    {isClearButtonVisible && (
                        <TouchableOpacity onPress={handleClear}>
                            <Icon name="xCircle" size="large" color="iconSubdued" />
                        </TouchableOpacity>
                    )}
                </Box>
            </Pressable>
        );
    },
);

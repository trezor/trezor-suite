import React, { ReactNode, useRef, useState } from 'react';
import { TextInput, Pressable } from 'react-native';

import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { Text } from '../Text';
import { Box } from '../Box';

type InputProps = {
    value: string;
    label: string;
    onChange: (value: string) => void;
    hasError?: boolean;
    hasWarning?: boolean;
    leftIcon?: ReactNode;
};

type InputWrapperStyleProps = {
    hasWarning: boolean;
    hasError: boolean;
};
const inputWrapperStyle = prepareNativeStyle<InputWrapperStyleProps>(
    (utils, { hasError, hasWarning }) => ({
        borderWidth: utils.borders.widths.small,
        borderColor: utils.colors.gray300,
        backgroundColor: utils.colors.gray300,
        borderRadius: utils.borders.radii.small,
        paddingVertical: utils.spacings.small,
        paddingHorizontal: 14,
        height: 58,
        justifyContent: 'center',
        extend: [
            {
                condition: hasWarning,
                style: {
                    borderColor: utils.colors.yellow,
                    borderWidth: utils.borders.widths.large,
                },
            },
            {
                condition: hasError,
                style: {
                    borderColor: utils.colors.red,
                    backgroundColor: utils.transparentize(0.95, utils.colors.red),
                },
            },
        ],
    }),
);

const inputStyle = prepareNativeStyle(utils => ({
    ...utils.typography.body,
    alignItems: 'center',
    justifyContent: 'center',
    color: utils.colors.gray700,
    padding: 0,
    height: 24,
}));

const leftIconStyle = prepareNativeStyle(() => ({
    marginRight: 3,
}));

export const Input = React.forwardRef<TextInput, InputProps>(
    (
        { value, onChange, label, leftIcon, hasError = false, hasWarning = false }: InputProps,
        ref,
    ) => {
        const [isFocused, setIsFocused] = useState<boolean>(false);
        const inputRef = useRef<TextInput | null>(null);
        const isLabelVisible = isFocused || Boolean(value);

        const { applyStyle, utils } = useNativeStyles();

        const handleInputFocus = () => inputRef?.current?.focus();

        return (
            <Pressable onPress={handleInputFocus}>
                <Box style={applyStyle(inputWrapperStyle, { hasError, hasWarning })}>
                    {isLabelVisible && (
                        <Text variant="label" color="gray600" numberOfLines={1}>
                            {label}
                        </Text>
                    )}
                    <Box flexDirection="row">
                        {leftIcon && <Box style={applyStyle(leftIconStyle)}>{leftIcon}</Box>}
                        <TextInput
                            ref={ref ?? inputRef}
                            value={value}
                            onChangeText={onChange}
                            style={applyStyle(inputStyle)}
                            onFocus={() => setIsFocused(true)}
                            onBlur={() => setIsFocused(false)}
                            placeholder={isFocused ? '' : label}
                            placeholderTextColor={utils.colors.gray600}
                        />
                    </Box>
                </Box>
            </Pressable>
        );
    },
);

import React, { useRef, useState } from 'react';
import { TouchableWithoutFeedback, TextInput } from 'react-native';

import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { Text } from '../Text';
import { Box } from '../Box';

type InputProps = {
    value: string;
    label: string;
    onChange: (value: string) => void;
    isInvalid?: boolean;
    hasWarning?: boolean;
};

type InputWrapperStyleProps = {
    hasWarning: boolean;
    isInvalid: boolean;
};
const inputWrapperStyle = prepareNativeStyle<InputWrapperStyleProps>(
    (utils, { isInvalid, hasWarning }) => ({
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
                condition: isInvalid,
                style: {
                    borderColor: utils.colors.red,
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
    maxHeight: 24,
}));

export const Input = ({
    value,
    onChange,
    label,
    isInvalid = false,
    hasWarning = false,
}: InputProps) => {
    const [isInputFocused, setIsInputFocused] = useState<boolean>(false);
    const inputRef = useRef<TextInput | null>(null);
    const shouldDisplayLabel = isInputFocused || Boolean(value);

    const { applyStyle, utils } = useNativeStyles();

    const handleInputFocus = () => inputRef?.current?.focus();

    return (
        <TouchableWithoutFeedback onPress={handleInputFocus}>
            <Box style={applyStyle(inputWrapperStyle, { isInvalid, hasWarning })}>
                {shouldDisplayLabel && (
                    <Text variant="label" color="gray600" numberOfLines={1}>
                        {label}
                    </Text>
                )}
                <TextInput
                    ref={inputRef}
                    value={value}
                    onChangeText={onChange}
                    style={applyStyle(inputStyle)}
                    onFocus={() => setIsInputFocused(true)}
                    onBlur={() => setIsInputFocused(false)}
                    placeholder={isInputFocused ? '' : label}
                    placeholderTextColor={utils.colors.gray600}
                />
            </Box>
        </TouchableWithoutFeedback>
    );
};

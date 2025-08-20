import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Platform, Pressable, TextInput } from 'react-native';

import { Box, HStack, Text } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

type DigitBoxProps = {
    value?: string;
    isFocused: boolean;
};

const digitBoxStyle = prepareNativeStyle<{ isFocused: boolean }>(
    ({ colors, borders }, { isFocused }) => ({
        margin: isFocused ? 0 : borders.widths.small,
        borderColor: isFocused ? colors.borderInputFocus : colors.borderInputDefault,
        borderWidth: isFocused ? borders.widths.large : borders.widths.small,
        borderRadius: borders.radii.r12,
        backgroundColor: colors.backgroundNeutralSubtleOnElevation0,
        justifyContent: 'center',
    }),
);

const digitStyle = prepareNativeStyle(utils => ({
    width: 48,
    height: 56,
    ...utils.typography.titleMedium,
    // TODO: Is there a better way?
    lineHeight: Platform.OS === 'ios' ? 62 : 56, // centers the digit vertically
    letterSpacing: 0, // fixes slight horizontal offset from the center
    textAlign: 'center',
    color: utils.colors.textDefault,
}));

const DigitBox = ({ value, isFocused }: DigitBoxProps) => {
    const { applyStyle } = useNativeStyles();

    return (
        <Box style={applyStyle(digitBoxStyle, { isFocused })}>
            <Text style={applyStyle(digitStyle)}>{value}</Text>
        </Box>
    );
};

type SecurityCodeInputProps = {
    length: number;
    onSubmit: (code: string) => void;
};

const textInputStyle = prepareNativeStyle(_ => ({
    position: 'absolute',
    top: -9999,
    opacity: 0,
}));

export const SecurityCodeInput = ({ length, onSubmit }: SecurityCodeInputProps) => {
    const { applyStyle } = useNativeStyles();

    const inputRef = useRef<TextInput>(null);

    const [isFocused, setIsFocused] = useState(false);
    const [code, setCode] = useState('');

    const focusInput = useCallback(() => {
        inputRef.current?.focus();
    }, []);

    const onKeyPress = (key: string) => {
        if (key >= '0' && key <= '9' && code.length < length) {
            const newCode = code + key;
            setCode(newCode);
            if (newCode.length === length) {
                onSubmit(newCode);
            }
        } else if (key === 'Backspace' && code.length > 0) {
            setCode(code.slice(0, -1));
        }
    };

    useEffect(() => {
        const timeoutId = setTimeout(focusInput, 1);

        return () => {
            clearTimeout(timeoutId);
        };
    }, [focusInput]);

    return (
        <Pressable onPress={focusInput}>
            <TextInput
                ref={inputRef}
                keyboardType="number-pad"
                textContentType="oneTimeCode"
                importantForAutofill="no"
                autoComplete="off"
                editable={code.length < length}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                onKeyPress={e => onKeyPress(e.nativeEvent.key)}
                style={applyStyle(textInputStyle)}
            />
            <HStack justifyContent="center" alignItems="center">
                {Array.from({ length }).map((_, i) => (
                    <DigitBox
                        key={i}
                        value={code.at(i)}
                        isFocused={isFocused && i === code.length}
                    />
                ))}
            </HStack>
        </Pressable>
    );
};

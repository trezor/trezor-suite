import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, TextInput } from 'react-native';

import { HStack } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import { DigitBox } from './DigitBox';

type SecurityCodeInputProps = {
    length: number;
    onSubmit: (code: string) => void;
};

// This e2e version of the component uses onChangeText instead of onKeyPress to be compatible with Detox testing framework
// The style removed to be able to interact with the input in e2e tests
export const SecurityCodeInput = ({ length, onSubmit }: SecurityCodeInputProps) => {
    const { applyStyle } = useNativeStyles();

    const inputRef = useRef<TextInput>(null);

    const [isFocused, setIsFocused] = useState(false);
    const [code, setCode] = useState('');

    const focusInput = useCallback(() => {
        inputRef.current?.focus();
    }, []);

    const onChangeText = (text: string) => {
        const digits = text.replace(/\D/g, '').slice(0, length);
        setCode(digits);
        if (digits.length === length) {
            onSubmit(digits);
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
                onChangeText={text => onChangeText(text)}
                style={applyStyle(prepareNativeStyle(_ => ({})))}
                testID="@thpSecurityCode/Input"
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

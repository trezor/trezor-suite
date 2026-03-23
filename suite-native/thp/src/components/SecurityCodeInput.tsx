import React, { useCallback, useRef, useState } from 'react';
import { Platform, Pressable, TextInput } from 'react-native';
import { KeyboardEvents } from 'react-native-keyboard-controller';

import { useFocusEffect } from '@react-navigation/native';

import { HStack } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import { DigitBox } from './DigitBox';

type SecurityCodeInputProps = {
    length: number;
    onSubmit: (code: string) => void;
};

const textInputStyle = prepareNativeStyle(_ => ({
    position: 'absolute',
    top: -9999,
    opacity: 0,
}));

const IS_IPAD = Platform.OS === 'ios' && Platform.isPad;

// New iPad OS (26.X +) introduces a floating number pad that does not work for this hidden input use case.
// For this reason, we use the `numbers-and-punctuation` keyboard type to display the traditional full width bottom keyboard.
const KEYBOARD_TYPE = IS_IPAD ? 'numbers-and-punctuation' : 'number-pad';

export const SecurityCodeInput = ({ length, onSubmit }: SecurityCodeInputProps) => {
    const { applyStyle } = useNativeStyles();

    const inputRef = useRef<TextInput>(null);

    const [isFocused, setIsFocused] = useState(false);
    const [code, setCode] = useState('');

    const focusInput = useCallback(() => {
        inputRef.current?.focus();
    }, []);

    const blurInput = useCallback(() => {
        inputRef.current?.blur();
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

    useFocusEffect(
        useCallback(() => {
            // Need to wait a while with focusing otherwise the keyboard might not show up.
            const timeoutId = setTimeout(focusInput, 100);
            // In case the keyboard is hidden on Android, ensure it shows up again upon focus.
            const subscription = KeyboardEvents.addListener('keyboardDidHide', blurInput);

            return () => {
                clearTimeout(timeoutId);
                subscription.remove();
            };
        }, [focusInput, blurInput]),
    );

    return (
        <Pressable onPress={focusInput}>
            <TextInput
                ref={inputRef}
                keyboardType={KEYBOARD_TYPE}
                textContentType="oneTimeCode"
                importantForAutofill="no"
                autoComplete="off"
                editable={code.length < length}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                onKeyPress={e => onKeyPress(e.nativeEvent.key)}
                style={applyStyle(textInputStyle)}
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

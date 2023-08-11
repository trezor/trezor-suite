import React, { useEffect, useState } from 'react';
import Animated, { FadeIn, FadeOut, SlideInLeft, SlideOutLeft } from 'react-native-reanimated';
import { TouchableOpacity } from 'react-native';

import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { HStack, SearchInput, Text } from '@suite-native/atoms';

type AccountsSearchFormProps = {
    onPressCancel: () => void;
    onInputChange: (value: string) => void;
};

export const SEARCH_FORM_HEIGHT = 48;
export const SEARCH_INPUT_ANIMATION_DURATION = 100;
export const SEARCH_INPUT_ANIMATION_DELAY = 100;
const MAX_SEARCH_VALUE_LENGTH = 30;
const KEYBOARD_INACTIVITY_TIMEOUT = 200;

const searchFormContainerStyle = prepareNativeStyle(() => ({
    height: SEARCH_FORM_HEIGHT,
}));

const searchFormInputStyle = prepareNativeStyle(() => ({
    flex: 1,
}));

const cancelButtonStyle = prepareNativeStyle(() => ({
    justifyContent: 'center',
    alignItems: 'center',
}));

export const AccountsSearchForm = ({ onPressCancel, onInputChange }: AccountsSearchFormProps) => {
    const { applyStyle } = useNativeStyles();

    const [inputText, setInputText] = useState('');

    // Change input value after short time of inactivity to prevent unnecessary re-renders while the user types.
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            onInputChange(inputText);
        }, KEYBOARD_INACTIVITY_TIMEOUT);

        return () => {
            clearTimeout(timeoutId);
        };
    }, [inputText, onInputChange]);

    return (
        <Animated.View
            entering={FadeIn.duration(SEARCH_INPUT_ANIMATION_DURATION).delay(
                SEARCH_INPUT_ANIMATION_DELAY,
            )}
            exiting={FadeOut.duration(SEARCH_INPUT_ANIMATION_DURATION)}
            style={applyStyle(searchFormContainerStyle)}
        >
            <HStack marginHorizontal="medium" spacing="medium" justifyContent="space-between">
                <Animated.View
                    entering={SlideInLeft.duration(SEARCH_INPUT_ANIMATION_DURATION).delay(
                        SEARCH_INPUT_ANIMATION_DELAY,
                    )}
                    exiting={SlideOutLeft.duration(SEARCH_INPUT_ANIMATION_DURATION)}
                    style={applyStyle(searchFormInputStyle)}
                >
                    <SearchInput
                        value={inputText}
                        placeholder="Search assets"
                        onChange={setInputText}
                        maxLength={MAX_SEARCH_VALUE_LENGTH}
                    />
                </Animated.View>

                {/*  TODO : Replace with a TextButton atom component when the design is ready.
                            issue: https://github.com/trezor/trezor-suite/issues/9084 */}
                <TouchableOpacity onPress={onPressCancel} style={applyStyle(cancelButtonStyle)}>
                    <Text color="textPrimaryDefault">Cancel</Text>
                </TouchableOpacity>
            </HStack>
        </Animated.View>
    );
};

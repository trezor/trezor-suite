import { useEffect, useState } from 'react';
import Animated, { FadeIn, FadeOut, SlideInLeft, SlideOutLeft } from 'react-native-reanimated';

import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { Box, HStack, SearchInput, TextButton } from '@suite-native/atoms';

type AccountsSearchFormProps = {
    onPressCancel: () => void;
    onInputChange: (value: string) => void;
};

export const SEARCH_INPUT_ANIMATION_DURATION = 100;
export const SEARCH_INPUT_ANIMATION_DELAY = 100;
const MAX_SEARCH_VALUE_LENGTH = 30;
const KEYBOARD_INACTIVITY_TIMEOUT = 200;

const searchFormInputStyle = prepareNativeStyle(() => ({
    flex: 1,
}));

const cancelButtonContainerStyle = prepareNativeStyle(() => ({
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
        >
            <HStack marginHorizontal="m" spacing="m" justifyContent="space-between">
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

                <Box style={applyStyle(cancelButtonContainerStyle)}>
                    <TextButton onPress={onPressCancel}>Cancel</TextButton>
                </Box>
            </HStack>
        </Animated.View>
    );
};

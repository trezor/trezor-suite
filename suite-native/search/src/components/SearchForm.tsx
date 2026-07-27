import { useEffect, useState } from 'react';
import Animated, { FadeIn, FadeOut, SlideInLeft, SlideOutLeft } from 'react-native-reanimated';

import { Box, HStack, SearchInput, TextButton } from '@suite-native/atoms';
import { Translation, type TxKeyPath, useTranslate } from '@suite-native/intl';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

type SearchFormProps = {
    placeholder?: TxKeyPath;
    onPressCancel: () => void;
    onInputChange: (value: string) => void;
};

export const SEARCH_INPUT_ANIMATION_DURATION = 100;
const SEARCH_INPUT_ANIMATION_DELAY = 100;
const KEYBOARD_INACTIVITY_TIMEOUT = 200;
const MAX_SEARCH_VALUE_LENGTH = 30;

const searchFormInputStyle = prepareNativeStyle(() => ({
    flex: 1,
}));

const cancelButtonContainerStyle = prepareNativeStyle(() => ({
    justifyContent: 'center',
    alignItems: 'center',
}));

export const SearchForm = ({ placeholder, onPressCancel, onInputChange }: SearchFormProps) => {
    const { translate } = useTranslate();
    const { applyStyle } = useNativeStyles();

    const [inputText, setInputText] = useState('');

    // Change the input value after a short time of inactivity to prevent unnecessary re-renders while the user types.
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            onInputChange(inputText);
        }, KEYBOARD_INACTIVITY_TIMEOUT);

        return () => {
            clearTimeout(timeoutId);
        };
    }, [inputText, onInputChange]);

    useEffect(
        () => () => {
            onInputChange('');
        },
        [onInputChange],
    );

    return (
        <Animated.View
            entering={FadeIn.duration(SEARCH_INPUT_ANIMATION_DURATION).delay(
                SEARCH_INPUT_ANIMATION_DELAY,
            )}
            exiting={FadeOut.duration(SEARCH_INPUT_ANIMATION_DURATION)}
        >
            <HStack marginRight="sp16" spacing="sp16" justifyContent="space-between">
                <Animated.View
                    entering={SlideInLeft.duration(SEARCH_INPUT_ANIMATION_DURATION).delay(
                        SEARCH_INPUT_ANIMATION_DELAY,
                    )}
                    exiting={SlideOutLeft.duration(SEARCH_INPUT_ANIMATION_DURATION)}
                    style={applyStyle(searchFormInputStyle)}
                >
                    <SearchInput
                        placeholder={placeholder && translate(placeholder)}
                        onChange={setInputText}
                        maxLength={MAX_SEARCH_VALUE_LENGTH}
                        //  eslint-disable-next-line jsx-a11y/no-autofocus
                        autoFocus
                    />
                </Animated.View>
                <Box style={applyStyle(cancelButtonContainerStyle)}>
                    <TextButton onPress={onPressCancel}>
                        <Translation id="generic.buttons.cancel" />
                    </TextButton>
                </Box>
            </HStack>
        </Animated.View>
    );
};

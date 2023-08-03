import React, { useEffect } from 'react';
import Animated, { FadeIn, FadeOut, SlideInLeft, SlideOutLeft } from 'react-native-reanimated';
import { useWatch } from 'react-hook-form';
import { TouchableOpacity } from 'react-native';

import { Icon } from '@suite-common/icons';
import { Form, TextInputField, useForm } from '@suite-native/forms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { yup } from '@trezor/validation';
import { Box, HStack, Text } from '@suite-native/atoms';

type AccountsSearchFormProps = {
    onPressCancel: () => void;
    onInputChange: (value: string) => void;
};

export const SEARCH_FORM_HEIGHT = 58;
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

const accountSearchFormValidationSchema = yup.object({
    searchValue: yup.string().max(MAX_SEARCH_VALUE_LENGTH),
});

type AccountSearchFormValues = yup.InferType<typeof accountSearchFormValidationSchema>;

const useAccountsSearchForm = () =>
    useForm<AccountSearchFormValues>({
        validation: accountSearchFormValidationSchema,
        reValidateMode: 'onChange',
    });

export const AccountsSearchForm = ({ onPressCancel, onInputChange }: AccountsSearchFormProps) => {
    const { applyStyle } = useNativeStyles();

    const form = useAccountsSearchForm();
    const { searchValue } = useWatch({ control: form.control });

    // Change input value after short time of inactivity to prevent unnecessary re-renders while the user types.
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            onInputChange(searchValue ?? '');
        }, KEYBOARD_INACTIVITY_TIMEOUT);

        return () => {
            clearTimeout(timeoutId);
        };
    }, [searchValue, onInputChange]);

    return (
        <Animated.View
            entering={FadeIn.duration(SEARCH_INPUT_ANIMATION_DURATION).delay(
                SEARCH_INPUT_ANIMATION_DELAY,
            )}
            exiting={FadeOut.duration(SEARCH_INPUT_ANIMATION_DURATION)}
            style={applyStyle(searchFormContainerStyle)}
        >
            <Box marginHorizontal="medium">
                <Form form={form}>
                    <HStack spacing="medium" justifyContent="space-between">
                        <Animated.View
                            entering={SlideInLeft.duration(SEARCH_INPUT_ANIMATION_DURATION).delay(
                                SEARCH_INPUT_ANIMATION_DELAY,
                            )}
                            exiting={SlideOutLeft.duration(SEARCH_INPUT_ANIMATION_DURATION)}
                            style={applyStyle(searchFormInputStyle)}
                        >
                            <TextInputField
                                leftIcon={
                                    <Icon name="search" color="iconOnTertiary" size="large" />
                                }
                                name="searchValue"
                                label="Search assets"
                                maxLength={MAX_SEARCH_VALUE_LENGTH}
                            />
                        </Animated.View>

                        {/*  TODO : Replace with a TextButton atom component when the design is ready.
                                 issue: https://github.com/trezor/trezor-suite/issues/9084 */}
                        <TouchableOpacity
                            onPress={onPressCancel}
                            style={applyStyle(cancelButtonStyle)}
                        >
                            <Text color="textPrimaryDefault">Cancel</Text>
                        </TouchableOpacity>
                    </HStack>
                </Form>
            </Box>
        </Animated.View>
    );
};

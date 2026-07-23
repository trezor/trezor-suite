import { type ReactNode } from 'react';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import { Box } from '../Box';
import { Hint } from '../Hint';
import { VStack } from '../Stack';
import { Text } from '../Text';

export type InputWrapperProps = {
    children: ReactNode;
    label?: string;
    hint?: string;
    error?: string;
};

const labelStyle = prepareNativeStyle(utils => ({
    marginTop: utils.spacings.sp8,
}));

// Temperorary translation of the error messages used in the native app.
// Should be later replaced by an implementation of a localization module.
const errorToMessageMap: Record<string, string> = {
    TR_REQUIRED_FIELD: 'Field is mandatory',
    TR_EXCEEDS_MAX: 'Number of characters exceeded',
};

export const InputWrapper = ({ children, label, hint, error }: InputWrapperProps) => {
    const { applyStyle } = useNativeStyles();

    const errorMessage = (error && errorToMessageMap[error]) ?? error;

    return (
        <VStack flex={1} spacing="sp6">
            {!!label && (
                <Text variant="body-md" color="contentPrimary" style={applyStyle(labelStyle)}>
                    {label}
                </Text>
            )}
            <Box>{children}</Box>
            {(!!error || !!hint) && (
                <Box marginLeft="sp12">
                    {!!error && (
                        <Animated.View entering={FadeIn} exiting={FadeOut}>
                            <Hint variant="error">{errorMessage}</Hint>
                        </Animated.View>
                    )}
                    {!!hint && (
                        <Animated.View entering={FadeIn} exiting={FadeOut}>
                            <Hint>{hint}</Hint>
                        </Animated.View>
                    )}
                </Box>
            )}
        </VStack>
    );
};

import { type ReactNode } from 'react';
import { FadeIn, FadeOut } from 'react-native-reanimated';

import { AnimatedView } from '../Animated/AnimatedView';
import { Box } from '../Box';
import { Hint } from '../Hint';
import { VStack } from '../Stack';
import { Text } from '../Text';

export type InputWrapperProps = {
    children: ReactNode;
    label?: ReactNode;
    hint?: string;
    error?: string;
};

// Temperorary translation of the error messages used in the native app.
// Should be later replaced by an implementation of a localization module.
const errorToMessageMap: Record<string, string> = {
    TR_REQUIRED_FIELD: 'Field is mandatory',
    TR_EXCEEDS_MAX: 'Number of characters exceeded',
    DATA_NOT_VALID_HEX: 'Not a valid hex',
};

export const InputWrapper = ({ children, label, hint, error }: InputWrapperProps) => {
    const errorMessage = (error && errorToMessageMap[error]) ?? error;

    return (
        <VStack flex={1} spacing="sp6">
            {!!label && (
                <Text variant="body-md" color="contentPrimary">
                    {label}
                </Text>
            )}
            <Box>{children}</Box>
            {(!!error || !!hint) && (
                <Box marginLeft="sp12">
                    {!!error && (
                        <AnimatedView entering={FadeIn} exiting={FadeOut}>
                            <Hint variant="error">{errorMessage}</Hint>
                        </AnimatedView>
                    )}
                    {!!hint && (
                        <AnimatedView entering={FadeIn} exiting={FadeOut}>
                            <Hint>{hint}</Hint>
                        </AnimatedView>
                    )}
                </Box>
            )}
        </VStack>
    );
};

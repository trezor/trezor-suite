import { type ReactNode } from 'react';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { isTranslationKey, useTranslate } from '@suite-native/intl';

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

export const InputWrapper = ({ children, label, hint, error }: InputWrapperProps) => {
    const { translate } = useTranslate();

    const errorMessage = isTranslationKey(error) ? translate(error) : error;

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

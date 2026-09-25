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

export const InputWrapper = ({ children, label, hint, error }: InputWrapperProps) => {
    const { applyStyle } = useNativeStyles();

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
                            <Hint variant="error">{error}</Hint>
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

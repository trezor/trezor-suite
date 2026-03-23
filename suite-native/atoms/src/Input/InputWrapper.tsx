import { type ReactNode } from 'react';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import { Box } from '../Box';
import { Hint } from '../Hint';
import { Text } from '../Text';

export type InputWrapperProps = {
    children: ReactNode;
    label?: string;
    hint?: string;
    error?: string;
};

const labelStyle = prepareNativeStyle(utils => ({
    marginTop: utils.spacings.sp8,
    marginLeft: 11,
    marginBottom: 18,
}));

const hintStyle = prepareNativeStyle(
    (utils, { error, hint }: Pick<InputWrapperProps, 'error' | 'hint'>) => ({
        marginTop: 0,
        marginLeft: utils.spacings.sp12,
        extend: {
            condition: !!error || !!hint,
            style: {
                marginTop: utils.spacings.sp8,
            },
        },
    }),
);

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
        <Box>
            {label && (
                <Text variant="body-md-strong" color="textSubdued" style={applyStyle(labelStyle)}>
                    {label}
                </Text>
            )}
            <Box>{children}</Box>
            <Box style={applyStyle(hintStyle, { error, hint })}>
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
        </Box>
    );
};

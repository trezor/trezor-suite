import { ReactNode } from 'react';

import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { Box } from '../Box';
import { Text } from '../Text';
import { Hint } from '../Hint';

export type InputWrapperProps = {
    children: ReactNode;
    label?: string;
    hint?: string;
    error?: string;
};

const labelStyle = prepareNativeStyle(utils => ({
    marginTop: utils.spacings.s,
    marginLeft: 11,
    marginBottom: 18,
}));

const hintStyle = prepareNativeStyle(
    (_, { error, hint }: Pick<InputWrapperProps, 'error' | 'hint'>) => ({
        marginTop: 0,
        extend: {
            condition: !!error || !!hint,
            style: {
                marginTop: 3,
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
                <Text variant="highlight" color="textSubdued" style={applyStyle(labelStyle)}>
                    {label}
                </Text>
            )}
            <Box>{children}</Box>
            <Box style={applyStyle(hintStyle, { error, hint })}>
                {!!error && <Hint variant="error">{errorMessage}</Hint>}
                {!!hint && <Hint>{hint}</Hint>}
            </Box>
        </Box>
    );
};

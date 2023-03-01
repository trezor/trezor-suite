import React, { ReactNode } from 'react';

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
    marginTop: utils.spacings.small,
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

export const InputWrapper = ({ children, label, hint, error }: InputWrapperProps) => {
    const { applyStyle } = useNativeStyles();

    return (
        <Box>
            {label && (
                <Text variant="highlight" color="textSubdued" style={applyStyle(labelStyle)}>
                    {label}
                </Text>
            )}
            <Box>{children}</Box>
            <Box style={applyStyle(hintStyle, { error, hint })}>
                {!!error && <Hint variant="error">{error}</Hint>}
                {!!hint && <Hint>{hint}</Hint>}
            </Box>
        </Box>
    );
};

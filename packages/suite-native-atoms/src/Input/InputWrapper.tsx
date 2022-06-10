import React, { ReactNode } from 'react';

import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { Box } from '../Box';
import { Text } from '../Text';

type InputWrapperProps = {
    children: ReactNode;
    label?: string;
    hint?: ReactNode;
};

const labelStyle = prepareNativeStyle(utils => ({
    marginTop: utils.spacings.small,
    marginLeft: 11,
    marginBottom: 18,
}));

export const InputWrapper = ({ children, label, hint }: InputWrapperProps) => {
    const { applyStyle } = useNativeStyles();

    return (
        <Box>
            {label && (
                <Text variant="highlight" color="gray800" style={applyStyle(labelStyle)}>
                    {label}
                </Text>
            )}
            <Box>{children}</Box>
            {hint}
        </Box>
    );
};

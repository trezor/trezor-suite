import React, { ReactNode } from 'react';

import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { Box } from '../Box';
import { Text } from '../Text';

type InputWrapperProps = {
    children: ReactNode;
    label?: string;
};

const inputWrapperStyle = prepareNativeStyle(utils => ({
    backgroundColor: utils.colors.gray100,
    borderRadius: utils.borders.radii.medium,
    padding: utils.spacings.small,
}));

const labelStyle = prepareNativeStyle(utils => ({
    marginTop: utils.spacings.small,
    marginLeft: 11,
    marginBottom: 18,
}));

export const InputWrapper = ({ children, label }: InputWrapperProps) => {
    const { applyStyle } = useNativeStyles();

    return (
        <Box style={applyStyle(inputWrapperStyle)}>
            {label && (
                <Text variant="highlight" color="gray800" style={applyStyle(labelStyle)}>
                    {label}
                </Text>
            )}
            {children}
        </Box>
    );
};

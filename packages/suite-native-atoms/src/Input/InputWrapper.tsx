import React, { ReactNode } from 'react';

import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { Box } from '../Box';

type InputWrapperProps = {
    children: ReactNode;
};

const inputWrapperStyle = prepareNativeStyle(utils => ({
    backgroundColor: utils.colors.white,
}));

export const InputWrapper = ({ children }: InputWrapperProps) => {
    const { applyStyle } = useNativeStyles();

    return <Box style={applyStyle(inputWrapperStyle)}>{children}</Box>;
};

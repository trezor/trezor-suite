import React from 'react';

import { createRenderer, StylesProvider } from '@trezor/styles';
import { prepareNativeTheme } from '@trezor/theme';

type ProviderProps = {
    children: React.ReactNode;
};
const renderer = createRenderer();
const theme = prepareNativeTheme({ colorVariant: 'chill' });

export const Provider = ({ children }: ProviderProps) => (
    <StylesProvider theme={theme} renderer={renderer}>
        {children}
    </StylesProvider>
);

import React from 'react';
import { Provider as ReduxProvider } from 'react-redux';

import { createRenderer, StylesProvider } from '@trezor/styles';
import { prepareNativeTheme } from '@trezor/theme';
import { store } from '@suite-native/state';

type ProviderProps = {
    children: React.ReactNode;
};
const renderer = createRenderer();
const theme = prepareNativeTheme({ colorVariant: 'chill' });

export const Provider = ({ children }: ProviderProps) => (
    <ReduxProvider store={store}>
        <StylesProvider theme={theme} renderer={renderer}>
            {children}
        </StylesProvider>
    </ReduxProvider>
);

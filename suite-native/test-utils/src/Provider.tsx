import { ReactNode } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { createRenderer, StylesProvider } from '@trezor/styles';
import { prepareNativeTheme } from '@trezor/theme';

type ProviderProps = {
    children: ReactNode;
};
const renderer = createRenderer();
const theme = prepareNativeTheme({ colorVariant: 'standard' });

export const Provider = ({ children }: ProviderProps) => (
    <SafeAreaProvider>
        <StylesProvider theme={theme} renderer={renderer}>
            {children}
        </StylesProvider>
    </SafeAreaProvider>
);

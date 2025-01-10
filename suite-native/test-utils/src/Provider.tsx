import { ReactNode } from 'react';

import { createRenderer, StylesProvider } from '@trezor/styles';
import { prepareNativeTheme } from '@trezor/theme';
import { IntlProvider } from '@suite-native/intl';

type ProviderProps = {
    children: ReactNode;
};
const renderer = createRenderer();
const theme = prepareNativeTheme({ colorVariant: 'standard' });

export const Provider = ({ children }: ProviderProps) => (
    <IntlProvider>
        <StylesProvider theme={theme} renderer={renderer}>
            {children}
        </StylesProvider>
    </IntlProvider>
);

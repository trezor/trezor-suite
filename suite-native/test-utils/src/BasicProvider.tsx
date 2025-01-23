import { ReactNode } from 'react';

import { NavigationContainer } from '@react-navigation/native';

import { createRenderer, StylesProvider } from '@trezor/styles';
import { prepareNativeTheme } from '@trezor/theme';
import { IntlProvider } from '@suite-native/intl';

type ProviderProps = {
    children: ReactNode;
};

const renderer = createRenderer();
const theme = prepareNativeTheme({ colorVariant: 'standard' });

export const BasicProvider = ({ children }: ProviderProps) => (
    <IntlProvider>
        <StylesProvider theme={theme} renderer={renderer}>
            <NavigationContainer>{children}</NavigationContainer>
        </StylesProvider>
    </IntlProvider>
);

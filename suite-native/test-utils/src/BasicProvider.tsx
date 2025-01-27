import { ReactNode } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

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
    <SafeAreaProvider>
        <IntlProvider>
            <StylesProvider theme={theme} renderer={renderer}>
                <NavigationContainer>{children}</NavigationContainer>
            </StylesProvider>
        </IntlProvider>
    </SafeAreaProvider>
);

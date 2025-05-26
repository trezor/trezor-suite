import { ReactNode } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { NavigationContainer } from '@react-navigation/native';

import { FormatterProvider, FormatterProviderConfig } from '@suite-common/formatters';
import { IntlProvider } from '@suite-native/intl';
import { StylesProvider, createRenderer } from '@trezor/styles';
import { prepareNativeTheme } from '@trezor/theme';

type ProviderProps = {
    children: ReactNode;
    formattersConfig?: FormatterProviderConfig;
};

const renderer = createRenderer();
const theme = prepareNativeTheme({ colorVariant: 'standard' });

const DEFAULT_FORMATTERS_CONFIG: FormatterProviderConfig = {
    locale: 'en' as const,
    fiatCurrency: 'usd' as const,
    bitcoinAmountUnit: 0,
    is24HourFormat: true,
};

export const BasicProviderForTests = ({ children, formattersConfig }: ProviderProps) => (
    <SafeAreaProvider>
        <IntlProvider>
            <StylesProvider theme={theme} renderer={renderer}>
                <NavigationContainer>
                    <FormatterProvider config={formattersConfig ?? DEFAULT_FORMATTERS_CONFIG}>
                        <BottomSheetModalProvider>{children}</BottomSheetModalProvider>
                    </FormatterProvider>
                </NavigationContainer>
            </StylesProvider>
        </IntlProvider>
    </SafeAreaProvider>
);

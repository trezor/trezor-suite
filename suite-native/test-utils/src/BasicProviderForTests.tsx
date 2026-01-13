import { ReactNode } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { NavigationContainer } from '@react-navigation/native';

import type { FormatterProviderConfig } from '@suite-common/formatters';
import { FormatterProvider } from '@suite-common/formatters/src/FormatterProvider';
import { IntlProviderForTests } from '@suite-native/intl/src/IntlProviderForTests';
import { StylesProvider } from '@trezor/styles/src/StylesProvider';
import { createRenderer } from '@trezor/styles/src/createRenderer';
import { prepareNativeTheme } from '@trezor/theme/src/prepareTheme';

type ProviderProps = {
    children: ReactNode;
    formattersConfig?: FormatterProviderConfig;
};

const renderer = createRenderer();
const theme = prepareNativeTheme({ colorVariant: 'standard' });

const DEFAULT_FORMATTERS_CONFIG: FormatterProviderConfig = {
    locale: 'en' as const,
    baseCurrency: 'usd' as const,
    bitcoinAmountUnit: 0,
    is24HourFormat: true,
};

export const BasicProviderForTests = ({ children, formattersConfig }: ProviderProps) => (
    <SafeAreaProvider>
        <IntlProviderForTests>
            <StylesProvider theme={theme} renderer={renderer}>
                <NavigationContainer>
                    <FormatterProvider config={formattersConfig ?? DEFAULT_FORMATTERS_CONFIG}>
                        <BottomSheetModalProvider>{children}</BottomSheetModalProvider>
                    </FormatterProvider>
                </NavigationContainer>
            </StylesProvider>
        </IntlProviderForTests>
    </SafeAreaProvider>
);

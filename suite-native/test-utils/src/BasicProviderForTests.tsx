import { ReactNode, useMemo } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { NavigationContainer } from '@react-navigation/native';

import { FormatterProvider } from '@suite-common/formatters';
import { IntlProvider } from '@suite-native/intl';
import { StylesProvider, createRenderer } from '@trezor/styles';
import { prepareNativeTheme } from '@trezor/theme';

type ProviderProps = {
    children: ReactNode;
};

const renderer = createRenderer();
const theme = prepareNativeTheme({ colorVariant: 'standard' });

export const BasicProviderForTests = ({ children }: ProviderProps) => {
    const formattersConfig = useMemo(
        () => ({
            locale: 'en' as const,
            fiatCurrency: 'usd' as const,
            bitcoinAmountUnit: 0,
            is24HourFormat: true,
        }),
        [],
    );

    return (
        <SafeAreaProvider>
            <IntlProvider>
                <StylesProvider theme={theme} renderer={renderer}>
                    <NavigationContainer>
                        <FormatterProvider config={formattersConfig}>
                            <BottomSheetModalProvider>{children}</BottomSheetModalProvider>
                        </FormatterProvider>
                    </NavigationContainer>
                </StylesProvider>
            </IntlProvider>
        </SafeAreaProvider>
    );
};

import { type ReactNode } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { NavigationContainer } from '@react-navigation/native';

import { FormatterProvider, type FormatterProviderConfig } from '@suite-common/formatters';
import { IntlProviderForTests } from '@suite-native/intl';
import { NativeServicesProvider } from '@suite-native/services';
import { StylesProvider, createRenderer } from '@trezor/styles';
import { prepareNativeTheme } from '@trezor/theme';

import { extraDependenciesNativeMock } from './extraDependenciesNative.mock';

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
                    <NativeServicesProvider services={extraDependenciesNativeMock.services}>
                        <FormatterProvider config={formattersConfig ?? DEFAULT_FORMATTERS_CONFIG}>
                            <BottomSheetModalProvider>{children}</BottomSheetModalProvider>
                        </FormatterProvider>
                    </NativeServicesProvider>
                </NavigationContainer>
            </StylesProvider>
        </IntlProviderForTests>
    </SafeAreaProvider>
);

import { type ReactNode } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { NavigationContainer } from '@react-navigation/native';

import { ServicesProvider } from '@suite-common/dependency-injection';
import { FormatterProvider, type FormatterProviderConfig } from '@suite-common/formatters';
import { IntlProviderForTests } from '@suite-native/intl';
import { StylesProvider, createRenderer } from '@trezor/styles-native';
import { prepareNativeTheme } from '@trezor/theme';

import { extraDependenciesNativeMock } from './extraDependenciesNative.mock';

type ProviderProps = {
    children: ReactNode;
    formattersConfig?: FormatterProviderConfig;
    services?: Record<string, unknown>;
    // expo-router supplies its own NavigationContainer; nesting another one triggers a linking conflict.
    omitNavigationContainer?: boolean;
};

const renderer = createRenderer();
const theme = prepareNativeTheme({ colorVariant: 'standard' });

const DEFAULT_FORMATTERS_CONFIG: FormatterProviderConfig = {
    locale: 'en' as const,
    baseCurrency: 'usd' as const,
    bitcoinAmountUnit: 0,
    is24HourFormat: true,
};

export const BasicProviderForTests = ({
    children,
    formattersConfig,
    services,
    omitNavigationContainer,
}: ProviderProps) => {
    const inner = (
        <ServicesProvider
            services={{
                ...extraDependenciesNativeMock.services,
                ...services,
            }}
        >
            <FormatterProvider config={formattersConfig ?? DEFAULT_FORMATTERS_CONFIG}>
                <BottomSheetModalProvider>{children}</BottomSheetModalProvider>
            </FormatterProvider>
        </ServicesProvider>
    );

    return (
        <SafeAreaProvider>
            <IntlProviderForTests>
                <StylesProvider theme={theme} renderer={renderer}>
                    {omitNavigationContainer ? (
                        inner
                    ) : (
                        <NavigationContainer>{inner}</NavigationContainer>
                    )}
                </StylesProvider>
            </IntlProviderForTests>
        </SafeAreaProvider>
    );
};

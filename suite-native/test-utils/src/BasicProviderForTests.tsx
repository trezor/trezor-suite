import { type ReactNode, useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { NavigationContainer } from '@react-navigation/native';

import { ServicesProvider, mock } from '@suite-common/dependency-injection';
import { FormatterProvider, type FormatterProviderConfig } from '@suite-common/formatters';
import {
    createNetworkModuleRepository,
    createNetworkModulesCompositionRoot,
} from '@suite-common/networks';
import { QueryClient, QueryClientProvider } from '@suite-common/react-query';
import { IntlProviderForTests } from '@suite-native/intl';
import { StylesProvider, createRenderer } from '@trezor/styles-native';
import { prepareNativeTheme } from '@trezor/theme';

type ProviderProps = {
    children: ReactNode;
    formattersConfig?: FormatterProviderConfig;
    services?: Record<string, unknown>;
};

const renderer = createRenderer();
const theme = prepareNativeTheme({ colorVariant: 'standard' });

const DEFAULT_FORMATTERS_CONFIG: FormatterProviderConfig = {
    locale: 'en' as const,
    baseCurrency: 'usd' as const,
    bitcoinAmountUnit: 0,
    is24HourFormat: true,
};

const createTestQueryClient = () =>
    new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } });

export const BasicProviderForTests = ({ children, formattersConfig, services }: ProviderProps) => {
    const [queryClient] = useState(createTestQueryClient);
    const [networkModuleRepository] = useState(() =>
        createNetworkModuleRepository({
            networkModules: createNetworkModulesCompositionRoot({ getTrezorConnect: mock() }),
        }),
    );

    return (
        <SafeAreaProvider>
            <QueryClientProvider client={queryClient}>
                <IntlProviderForTests>
                    <StylesProvider theme={theme} renderer={renderer}>
                        <NavigationContainer>
                            <ServicesProvider
                                services={{ networks: { networkModuleRepository }, ...services }}
                            >
                                <FormatterProvider
                                    config={formattersConfig ?? DEFAULT_FORMATTERS_CONFIG}
                                >
                                    <BottomSheetModalProvider>{children}</BottomSheetModalProvider>
                                </FormatterProvider>
                            </ServicesProvider>
                        </NavigationContainer>
                    </StylesProvider>
                </IntlProviderForTests>
            </QueryClientProvider>
        </SafeAreaProvider>
    );
};

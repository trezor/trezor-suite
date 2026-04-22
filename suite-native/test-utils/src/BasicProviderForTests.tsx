import { type ReactNode } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { NavigationContainer } from '@react-navigation/native';

import { FormatterProvider, type FormatterProviderConfig } from '@suite-common/formatters';
import { IntlProviderForTests } from '@suite-native/intl';
import { NativeServicesProvider } from '@suite-native/services';
import { StylesProvider, createRenderer } from '@trezor/styles-native';
import { prepareNativeTheme } from '@trezor/theme';

import { extraDependenciesNativeMock } from './extraDependenciesNative.mock';

export type ProviderKey = 'intl' | 'navigation' | 'services' | 'formatter' | 'bottomSheet';

export const ALL_PROVIDERS: ProviderKey[] = [
    'intl',
    'navigation',
    'services',
    'formatter',
    'bottomSheet',
];

type ProviderForTestsProps = {
    children: ReactNode;
    providers?: ProviderKey[];
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

export const ProviderForTests = ({
    children,
    providers = [],
    formattersConfig,
}: ProviderForTestsProps) => {
    const has = (key: ProviderKey) => providers.includes(key);

    let tree: ReactNode = children;

    if (has('bottomSheet')) {
        tree = <BottomSheetModalProvider>{tree}</BottomSheetModalProvider>;
    }
    if (has('formatter')) {
        tree = (
            <FormatterProvider config={formattersConfig ?? DEFAULT_FORMATTERS_CONFIG}>
                {tree}
            </FormatterProvider>
        );
    }
    if (has('services')) {
        tree = (
            <NativeServicesProvider services={extraDependenciesNativeMock.services}>
                {tree}
            </NativeServicesProvider>
        );
    }
    if (has('navigation')) {
        tree = <NavigationContainer>{tree}</NavigationContainer>;
    }

    tree = (
        <StylesProvider theme={theme} renderer={renderer}>
            {tree}
        </StylesProvider>
    );

    if (has('intl')) {
        tree = <IntlProviderForTests>{tree}</IntlProviderForTests>;
    }

    return <SafeAreaProvider>{tree}</SafeAreaProvider>;
};

type BasicProviderForTestsProps = {
    children: ReactNode;
    formattersConfig?: FormatterProviderConfig;
};

export const BasicProviderForTests = ({
    children,
    formattersConfig,
}: BasicProviderForTestsProps) => (
    <ProviderForTests providers={ALL_PROVIDERS} formattersConfig={formattersConfig}>
        {children}
    </ProviderForTests>
);

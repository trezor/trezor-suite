import { type ReactNode, useContext, useMemo } from 'react';
import { IntlProvider } from 'react-intl';
import { Provider } from 'react-redux';

import { configureStore } from '@reduxjs/toolkit';
import { ThemeContext, ThemeProvider } from 'styled-components';

import { messages } from '@suite/intl';
import { type DiscreetModeRootState } from '@suite-common/discreet-mode';
import { FormatterProvider } from '@suite-common/formatters';
import { TokenMetadataProvider, type TokenMetadataSource } from '@suite-common/token';
import { type TokenDefinitionsRootState } from '@suite-common/token-definitions';
import { toTokenAddress } from '@suite-common/tokens';
import { asNetworkSymbol, networksCollection } from '@suite-common/wallet-config';
import {
    type AccountsRootState,
    type WalletSettingsRootState,
    initialWalletSettingsState,
} from '@suite-common/wallet-core';
import { type BaseCurrencyCode } from '@trezor/blockchain-link-types';
import { intermediaryTheme } from '@trezor/components';
import { PROTO } from '@trezor/connect';
import { ServicesProvider } from '@trezor/dependency-injection';
import { type NetworkConfigState, type NetworkSymbol } from '@trezor/network-module-types';
import { type ProductComponentsServices } from '@trezor/product-components';

export const mockAssetItemContract = toTokenAddress('0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48');
export const mockAssetItemMissingMetadataContract = toTokenAddress(
    '0x0000000000000000000000000000000000000003',
);
export const mockAssetItemSuspiciousContract = toTokenAddress(
    '0x0000000000000000000000000000000000000002',
);
export const mockAssetItemRecognizedUrlContract = toTokenAddress(
    '0x0000000000000000000000000000000000000004',
);

const sources: TokenMetadataSource[] = [
    {
        networkSymbol: asNetworkSymbol('eth'),
        tokens: [
            {
                contract: mockAssetItemContract,
                name: 'USD Coin',
                symbol: 'USDC',
                decimals: 6,
                isRecognized: true,
            },
            {
                contract: mockAssetItemSuspiciousContract,
                name: 'https://scam.com/claim',
                symbol: 'https://scam.com/claim',
                decimals: 18,
            },
            {
                contract: mockAssetItemRecognizedUrlContract,
                name: 'https://trezor.io',
                symbol: 'https://trezor.io',
                decimals: 8,
                isRecognized: true,
            },
        ],
    },
];

const fixtureMessages = Object.fromEntries(
    Object.values(messages).map(message => [message.id, message.defaultMessage as string]),
);
const networks = Object.fromEntries(networksCollection.map(network => [network.symbol, network]));

type AssetItemFixtureState = AccountsRootState &
    WalletSettingsRootState &
    DiscreetModeRootState &
    TokenDefinitionsRootState &
    NetworkConfigState;

const mockServices: ProductComponentsServices = {
    networks: {
        isWrappedNativeToken: () => false,
        networkIcon: {
            getCryptoIcon: () =>
                'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"%3E%3Ccircle cx="16" cy="16" r="16" fill="%236277bf"/%3E%3C/svg%3E',
            getNetworkIcon: () =>
                'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"%3E%3Crect width="32" height="32" fill="%236277bf"/%3E%3C/svg%3E',
            hasCryptoIcon: () => true,
            hasNetworkIcon: (symbol): symbol is NetworkSymbol => !!symbol,
            getTokenLogoIdentifiers: (_symbol, contract) => (contract ? [contract] : []),
        },
    },
};

type MockAssetItemEnvironmentProps = {
    children: ReactNode;
    services?: ProductComponentsServices;
    isDiscreet?: boolean;
    useSats?: boolean;
    locale?: string;
    fiatCurrency?: BaseCurrencyCode;
};

export const MockAssetItemEnvironment = ({
    children,
    services = mockServices,
    isDiscreet = false,
    useSats = false,
    locale = 'en',
    fiatCurrency = 'usd',
}: MockAssetItemEnvironmentProps) => {
    const bitcoinAmountUnit = useSats ? PROTO.AmountUnit.SATOSHI : PROTO.AmountUnit.BITCOIN;
    const inheritedTheme = useContext(ThemeContext);
    const store = useMemo(() => {
        const state: AssetItemFixtureState = {
            wallet: {
                accounts: [],
                settings: {
                    ...initialWalletSettingsState,
                    localCurrency: fiatCurrency,
                    bitcoinAmountUnit,
                },
            },
            discreetMode: { isActive: isDiscreet },
            tokenDefinitions: {},
            networks,
        };

        return configureStore({ reducer: () => state });
    }, [fiatCurrency, bitcoinAmountUnit, isDiscreet]);

    return (
        <Provider store={store}>
            <ServicesProvider services={services}>
                <ThemeProvider
                    theme={inheritedTheme ?? { ...intermediaryTheme.light, variant: 'light' }}
                >
                    <IntlProvider locale={locale} messages={fixtureMessages}>
                        <FormatterProvider
                            config={{
                                locale,
                                bitcoinAmountUnit,
                                baseCurrency: fiatCurrency,
                                is24HourFormat: true,
                            }}
                        >
                            <TokenMetadataProvider sources={sources}>
                                {children}
                            </TokenMetadataProvider>
                        </FormatterProvider>
                    </IntlProvider>
                </ThemeProvider>
            </ServicesProvider>
        </Provider>
    );
};

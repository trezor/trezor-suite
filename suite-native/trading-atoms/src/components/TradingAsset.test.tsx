import { type FiatCurrencyCode } from 'invity-api';

import { mockNetworkMetadata, mockNetworksServices } from '@suite-common/networks/mocks';
import { TokenMetadataProvider } from '@suite-common/token';
import { toTokenAddress } from '@suite-common/tokens';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { Text } from '@suite-native/atoms';
import { renderWithStoreProvider } from '@suite-native/test-utils-store';

import { TradingAsset } from './TradingAsset';

describe('TradingAsset', () => {
    it('renders a crypto name with its symbol and network badge by default', async () => {
        const { getByTestId, getByText } = await renderWithStoreProvider(
            <TokenMetadataProvider
                sources={[
                    {
                        networkSymbol: asNetworkSymbol('eth'),
                        tokens: [
                            {
                                contract: toTokenAddress(
                                    '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
                                ),
                                name: 'USD Coin',
                                symbol: 'USDC',
                                decimals: 6,
                            },
                        ],
                    },
                ]}
            >
                <TradingAsset
                    assetType="crypto"
                    contractAddress="0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48"
                    networkSymbol={asNetworkSymbol('eth')}
                    testID="@test/trading-asset"
                />
            </TokenMetadataProvider>,
            {
                preloadedState: { networks: mockNetworkMetadata },
                services: { networks: mockNetworksServices() },
            },
        );

        expect(getByTestId('@test/trading-asset/primary-label')).toHaveTextContent('USD Coin');
        expect(getByTestId('@test/trading-asset/secondary-symbol')).toHaveTextContent('USDC');
        expect(getByText('Ethereum')).toBeOnTheScreen();
    });

    it('renders a crypto symbol with network text without repeating the symbol', async () => {
        const { getByTestId, queryByTestId } = await renderWithStoreProvider(
            <TokenMetadataProvider
                sources={[
                    {
                        networkSymbol: asNetworkSymbol('eth'),
                        tokens: [
                            {
                                contract: toTokenAddress(
                                    '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
                                ),
                                name: 'USD Coin',
                                symbol: 'USDC',
                                decimals: 6,
                            },
                        ],
                    },
                ]}
            >
                <TradingAsset
                    contractAddress="0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48"
                    assetType="crypto"
                    networkDisplay="text"
                    networkSymbol={asNetworkSymbol('eth')}
                    primaryLabel="symbol"
                    testID="@test/trading-asset"
                />
            </TokenMetadataProvider>,
            {
                preloadedState: { networks: mockNetworkMetadata },
                services: { networks: mockNetworksServices() },
            },
        );

        expect(getByTestId('@test/trading-asset/primary-label')).toHaveTextContent('USDC');
        expect(queryByTestId('@test/trading-asset/secondary-symbol')).not.toBeOnTheScreen();
        expect(getByTestId('@test/trading-asset/network-text')).toHaveTextContent('Ethereum');
    });

    it.each([
        ['name', undefined, 'USDC', 'USDC'],
        ['symbol', 'USD Coin', undefined, 'USD Coin'],
        ['name', undefined, undefined, '0x0000000000000000000000000000000000000001'],
        ['symbol', undefined, undefined, '0x0000000000000000000000000000000000000001'],
    ] as const)(
        'falls back from the preferred %s when token metadata is incomplete (%#)',
        async (preferred, name, symbol, expected) => {
            const networkSymbol = asNetworkSymbol('eth');
            const contract = '0x0000000000000000000000000000000000000001';
            const { getByTestId } = await renderWithStoreProvider(
                <TokenMetadataProvider
                    sources={[
                        {
                            networkSymbol,
                            tokens: name || symbol ? [{ contract, name, symbol }] : [],
                        },
                    ]}
                >
                    <TradingAsset
                        assetType="crypto"
                        contractAddress={contract}
                        networkSymbol={networkSymbol}
                        primaryLabel={preferred}
                        testID="@test/trading-asset"
                    />
                </TokenMetadataProvider>,
                {
                    preloadedState: { networks: mockNetworkMetadata, wallet: { accounts: [] } },
                    services: { networks: mockNetworksServices() },
                },
            );

            expect(getByTestId('@test/trading-asset/primary-label')).toHaveTextContent(expected);
        },
    );

    it('renders a fiat flag with name, symbol, configured size, and right content', async () => {
        const { getByLabelText, getByTestId, getByText } = await renderWithStoreProvider(
            <TradingAsset
                assetType="fiat"
                fiatCurrency="usd"
                iconSize="small"
                name="United States Dollar"
                rightContent={<Text>Right content</Text>}
                spacing="sp12"
                symbol="USD"
                testID="@test/trading-asset"
            />,
            {
                preloadedState: { networks: mockNetworkMetadata },
                services: { networks: mockNetworksServices() },
            },
        );

        expect(getByLabelText('flag-US')).toHaveStyle({ height: 32, width: 32 });
        expect(getByText('United States Dollar')).toBeOnTheScreen();
        expect(getByTestId('@test/trading-asset/secondary-symbol')).toHaveTextContent('USD');
        expect(getByTestId('@test/trading-asset/right-content')).toHaveTextContent('Right content');
    });

    it('renders only the fiat symbol with configured typography and falls back to a coin icon', async () => {
        const { getByTestId, queryByRole, queryByTestId } = await renderWithStoreProvider(
            <TradingAsset
                assetType="fiat"
                fiatCurrency={'unknown' as FiatCurrencyCode}
                name="Unknown currency"
                primaryLabel="symbol"
                primaryTextVariant="body-sm"
                symbol="XYZ"
                testID="@test/trading-asset"
            />,
            {
                preloadedState: { networks: mockNetworkMetadata },
                services: { networks: mockNetworksServices() },
            },
        );

        expect(getByTestId('@test/trading-asset/primary-label')).toHaveTextContent('XYZ');
        expect(getByTestId('@test/trading-asset/primary-label')).toHaveStyle({
            fontSize: 14,
            lineHeight: 20,
        });
        expect(queryByTestId('@test/trading-asset/secondary-symbol')).not.toBeOnTheScreen();
        expect(getByTestId('@trading/fiat-currency-icon-fallback')).toBeOnTheScreen();
        expect(queryByRole('button')).not.toBeOnTheScreen();
    });
});

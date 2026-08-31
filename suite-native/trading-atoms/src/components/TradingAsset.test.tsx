import type { FiatCurrencyCode } from 'invity-api';

import { Text } from '@suite-native/atoms';
import { renderWithBasicProvider } from '@suite-native/test-utils';

import { TradingAsset } from './TradingAsset';

describe('TradingAsset', () => {
    it('renders a crypto name with its symbol and network badge by default', async () => {
        const { getByTestId, getByText } = await renderWithBasicProvider(
            <TradingAsset
                assetType="crypto"
                contractAddress="0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48"
                name="USD Coin"
                networkSymbol="eth"
                symbol="USDC"
                testID="@test/trading-asset"
            />,
        );

        expect(getByTestId('@test/trading-asset/primary-label')).toHaveTextContent('USD Coin');
        expect(getByTestId('@test/trading-asset/secondary-symbol')).toHaveTextContent('USDC');
        expect(getByText('Ethereum')).toBeOnTheScreen();
    });

    it('renders a crypto symbol with network text without repeating the symbol', async () => {
        const { getByTestId, queryByTestId } = await renderWithBasicProvider(
            <TradingAsset
                assetType="crypto"
                name="USD Coin"
                networkDisplay="text"
                networkSymbol="eth"
                primaryLabel="symbol"
                symbol="USDC"
                testID="@test/trading-asset"
            />,
        );

        expect(getByTestId('@test/trading-asset/primary-label')).toHaveTextContent('USDC');
        expect(queryByTestId('@test/trading-asset/secondary-symbol')).not.toBeOnTheScreen();
        expect(getByTestId('@test/trading-asset/network-text')).toHaveTextContent('Ethereum');
    });

    it('renders a fiat flag with name, symbol, configured size, and right content', async () => {
        const { getByLabelText, getByTestId, getByText } = await renderWithBasicProvider(
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
        );

        expect(getByLabelText('flag-US')).toHaveStyle({ height: 32, width: 32 });
        expect(getByText('United States Dollar')).toBeOnTheScreen();
        expect(getByTestId('@test/trading-asset/secondary-symbol')).toHaveTextContent('USD');
        expect(getByTestId('@test/trading-asset/right-content')).toHaveTextContent('Right content');
    });

    it('renders only the fiat symbol with configured typography and falls back to a coin icon', async () => {
        const { getByTestId, queryByRole, queryByTestId } = await renderWithBasicProvider(
            <TradingAsset
                assetType="fiat"
                fiatCurrency={'unknown' as FiatCurrencyCode}
                name="Unknown currency"
                primaryLabel="symbol"
                primaryTextVariant="body-sm"
                symbol="XYZ"
                testID="@test/trading-asset"
            />,
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

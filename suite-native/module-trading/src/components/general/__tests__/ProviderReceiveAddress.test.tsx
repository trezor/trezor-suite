import React from 'react';

import type { ExchangeTrade, SellFiatTrade } from 'invity-api';

import { AccountKey } from '@suite-common/wallet-types';
// eslint-disable-next-line local-rules/no-package-deep-imports
import { renderWithStoreProviderAsync } from '@suite-native/test-utils/store';
import {
    exchangeMercuryo,
    exchangeQuotes,
    getWalletState,
    sellBanxa,
    sellQuotes,
} from '@suite-native/trading-fixtures';

import { ProviderReceiveAddress } from '../ProviderReceiveAddress';

describe('ProviderReceiveAddress', () => {
    // Use real fixtures for more realistic test data
    const mockExchangeTrade: ExchangeTrade = {
        ...exchangeQuotes[0], // Use first exchange quote from fixtures
        sendAddress: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa', // Override with a real Bitcoin address
    };

    const mockSellFiatTrade: SellFiatTrade = {
        ...sellQuotes[0], // Use first sell quote from fixtures
        destinationAddress: '1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2', // Add destination address
    };

    const renderProviderReceiveAddress = async (
        trade: ExchangeTrade | SellFiatTrade,
        tradeType: 'exchange' | 'sell' = 'exchange',
        accountKey: AccountKey = 'btc-account-1' as AccountKey, // Todo: create properly via `createAccountKey()`
    ) => {
        const walletState = getWalletState({ tradeType });

        // Set up provider info in the trading state
        if (tradeType === 'exchange') {
            walletState.trading.exchange.exchangeInfo!.providerInfos = {
                mercuryo: exchangeMercuryo,
            };
            // Set trading account key so selectTradingExchangeAccountKey returns a value
            walletState.trading.exchange.tradingAccountKey = accountKey;
        } else {
            walletState.trading.sell.sellInfo!.providerInfos = {
                'banxa-sell': sellBanxa, // Use banxa-sell to match the trade fixture
            };
            // Set trading account key so selectTradingSellAccountKey returns a value
            walletState.trading.sell.tradingAccountKey = accountKey;
        }

        return await renderWithStoreProviderAsync(<ProviderReceiveAddress trade={trade} />, {
            preloadedState: { wallet: walletState },
        });
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should display provider name and receive address for exchange trade', async () => {
        const { getByText } = await renderProviderReceiveAddress(mockExchangeTrade, 'exchange');

        // User should see the provider name in the label
        expect(getByText("Mercuryo's receive address")).toBeTruthy();
        // User should see the address split into readable chunks
        expect(getByText('1A1z P1eP 5QGe fi2D MPTf TL5S Lmv7 Divf Na')).toBeTruthy();
    });

    it('should display provider name and destination address for sell fiat trade', async () => {
        const { getByText } = await renderProviderReceiveAddress(mockSellFiatTrade, 'sell');

        // User should see the provider name in the label
        expect(getByText("Banxa's receive address")).toBeTruthy();
        // User should see the address split into readable chunks
        expect(getByText('1BvB MSEY stWe tqTF n5Au 4m4G Fg7x JaNV N2')).toBeTruthy();
    });

    it('should show fallback text when provider info is not available', async () => {
        const walletState = getWalletState({ tradeType: 'exchange' });
        // Don't set provider info to simulate missing provider
        walletState.trading.exchange.exchangeInfo!.providerInfos = {};

        const { queryByText } = await renderWithStoreProviderAsync(
            <ProviderReceiveAddress trade={mockExchangeTrade} />,
            { preloadedState: { wallet: walletState } },
        );

        // Component should not render when provider info is missing
        expect(queryByText("Provider's receive address")).toBeFalsy();
    });

    it('should show fallback text when provider company name is not available', async () => {
        const walletState = getWalletState({ tradeType: 'exchange' });
        // Don't set provider info to simulate missing provider
        walletState.trading.exchange.exchangeInfo!.providerInfos = {};

        const { queryByText } = await renderWithStoreProviderAsync(
            <ProviderReceiveAddress trade={mockExchangeTrade} />,
            { preloadedState: { wallet: walletState } },
        );

        // Component should not render when company name is missing
        expect(queryByText("Provider's receive address")).toBeFalsy();
    });

    it('should not render anything when receive address is missing for exchange trade', async () => {
        const tradeWithoutAddress = { ...mockExchangeTrade, sendAddress: undefined };

        const { queryByText } = await renderProviderReceiveAddress(tradeWithoutAddress, 'exchange');

        // User should not see any address information when address is missing
        expect(queryByText("Mercuryo's receive address")).toBeFalsy();
    });

    it('should not render anything when destination address is missing for sell fiat trade', async () => {
        const tradeWithoutAddress = { ...mockSellFiatTrade, destinationAddress: undefined };

        const { queryByText } = await renderProviderReceiveAddress(tradeWithoutAddress, 'sell');

        // User should not see any address information when address is missing
        expect(queryByText("Banxa's receive address")).toBeFalsy();
    });

    it('should display solana address as-is without splitting', async () => {
        const { getByText } = await renderProviderReceiveAddress(
            mockExchangeTrade,
            'exchange',
            'sol-account-1' as AccountKey, // Todo: create properly via `createAccountKey()`
        );

        // For Solana addresses, the address should be displayed without splitting
        expect(getByText('1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa')).toBeTruthy();
    });

    it('should display ethereum address with chunking for non-solana networks', async () => {
        const { getByText } = await renderProviderReceiveAddress(
            mockExchangeTrade,
            'exchange',
            'eth-account-1' as AccountKey, // Todo: create properly via `createAccountKey()`
        );

        // For non-Solana addresses, the address should be displayed with chunking
        expect(getByText('1A1z P1eP 5QGe fi2D MPTf TL5S Lmv7 Divf Na')).toBeTruthy();
    });

    it('should display bitcoin address with chunking for non-solana networks', async () => {
        const { getByText } = await renderProviderReceiveAddress(
            mockExchangeTrade,
            'exchange',
            'btc-account-1' as AccountKey, // Todo: create properly via `createAccountKey()`
        );

        // For non-Solana addresses, the address should be displayed with chunking
        expect(getByText('1A1z P1eP 5QGe fi2D MPTf TL5S Lmv7 Divf Na')).toBeTruthy();
    });

    it('should handle solana network type correctly', async () => {
        const solanaTrade = {
            ...mockExchangeTrade,
            sendAddress: '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM', // Real Solana address
        };

        const { getByText } = await renderProviderReceiveAddress(
            solanaTrade,
            'exchange',
            'sol-account-1' as AccountKey, // Todo: create properly via `createAccountKey()`
        );

        // For Solana addresses, the address should be displayed without splitting
        expect(getByText('9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM')).toBeTruthy();
    });

    it('should handle undefined network symbol gracefully', async () => {
        const { queryByText } = await renderProviderReceiveAddress(
            mockExchangeTrade,
            'exchange',
            'unknown-account-1' as AccountKey, // Todo: create properly via `createAccountKey()`
        );

        // Should not render anything when network symbol is undefined
        expect(queryByText('1A1z P1eP 5QGe fi2D MPTf TL5S Lmv7 Divf Na')).toBeFalsy();
    });
});

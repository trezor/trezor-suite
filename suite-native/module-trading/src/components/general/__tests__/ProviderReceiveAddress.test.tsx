import React from 'react';

import type { ExchangeTrade, SellFiatTrade } from 'invity-api';

import { type AccountKey } from '@suite-common/wallet-types';
import { renderWithStoreProvider } from '@suite-native/test-utils';
import {
    banxaCreditCardSellQuote,
    exchangeMercuryo,
    getWalletState,
    mercuryoFixedWorstQuote,
    sellBanxa,
} from '@suite-native/trading-fixtures';

import { ProviderReceiveAddress } from '../ProviderReceiveAddress';

describe('ProviderReceiveAddress', () => {
    // Use real fixtures for more realistic test data
    const mockExchangeTrade: ExchangeTrade = {
        ...mercuryoFixedWorstQuote,
        sendAddress: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa', // Override with a real Bitcoin address
    };

    const mockSellFiatTrade: SellFiatTrade = {
        ...banxaCreditCardSellQuote,
        destinationAddress: '1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2', // Add destination address
    };

    const renderProviderReceiveAddress = (
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

        return renderWithStoreProvider(<ProviderReceiveAddress trade={trade} />, {
            preloadedState: { wallet: walletState },
        });
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should display provider name and receive address for exchange trade', () => {
        const { getByText } = renderProviderReceiveAddress(mockExchangeTrade, 'exchange');

        // User should see the provider name in the label
        expect(getByText("Mercuryo's receive address")).toBeTruthy();
        // User should see the address split into readable chunks
        expect(getByText('1A1z P1eP 5QGe fi2D MPTf TL5S Lmv7 Divf Na')).toBeTruthy();
    });

    it('should display provider name and destination address for sell fiat trade', () => {
        const { getByText } = renderProviderReceiveAddress(mockSellFiatTrade, 'sell');

        // User should see the provider name in the label
        expect(getByText("Banxa's receive address")).toBeTruthy();
        // User should see the address split into readable chunks
        expect(getByText('1BvB MSEY stWe tqTF n5Au 4m4G Fg7x JaNV N2')).toBeTruthy();
    });

    it('should show fallback text when provider info is not available', () => {
        const walletState = getWalletState({ tradeType: 'exchange' });
        // Don't set provider info to simulate missing provider
        walletState.trading.exchange.exchangeInfo!.providerInfos = {};

        const { queryByText } = renderWithStoreProvider(
            <ProviderReceiveAddress trade={mockExchangeTrade} />,
            { preloadedState: { wallet: walletState } },
        );

        // Component should not render when provider info is missing
        expect(queryByText("Provider's receive address")).toBeFalsy();
    });

    it('should show fallback text when provider company name is not available', () => {
        const walletState = getWalletState({ tradeType: 'exchange' });
        // Don't set provider info to simulate missing provider
        walletState.trading.exchange.exchangeInfo!.providerInfos = {};

        const { queryByText } = renderWithStoreProvider(
            <ProviderReceiveAddress trade={mockExchangeTrade} />,
            { preloadedState: { wallet: walletState } },
        );

        // Component should not render when company name is missing
        expect(queryByText("Provider's receive address")).toBeFalsy();
    });

    it('should not render anything when receive address is missing for exchange trade', () => {
        const tradeWithoutAddress = { ...mockExchangeTrade, sendAddress: undefined };

        const { queryByText } = renderProviderReceiveAddress(tradeWithoutAddress, 'exchange');

        // User should not see any address information when address is missing
        expect(queryByText("Mercuryo's receive address")).toBeFalsy();
    });

    it('should not render anything when destination address is missing for sell fiat trade', () => {
        const tradeWithoutAddress = { ...mockSellFiatTrade, destinationAddress: undefined };

        const { queryByText } = renderProviderReceiveAddress(tradeWithoutAddress, 'sell');

        // User should not see any address information when address is missing
        expect(queryByText("Banxa's receive address")).toBeFalsy();
    });

    it('should display solana address as-is without splitting', () => {
        const { getByText } = renderProviderReceiveAddress(
            mockExchangeTrade,
            'exchange',
            'sol-account-1' as AccountKey, // Todo: create properly via `createAccountKey()`
        );

        // For Solana addresses, the address should be displayed without splitting
        expect(getByText('1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa')).toBeTruthy();
    });

    it('should display ethereum address with chunking for non-solana networks', () => {
        const { getByText } = renderProviderReceiveAddress(
            mockExchangeTrade,
            'exchange',
            'eth-account-1' as AccountKey, // Todo: create properly via `createAccountKey()`
        );

        // For non-Solana addresses, the address should be displayed with chunking
        expect(getByText('1A1z P1eP 5QGe fi2D MPTf TL5S Lmv7 Divf Na')).toBeTruthy();
    });

    it('should display bitcoin address with chunking for non-solana networks', () => {
        const { getByText } = renderProviderReceiveAddress(
            mockExchangeTrade,
            'exchange',
            'btc-account-1' as AccountKey, // Todo: create properly via `createAccountKey()`
        );

        // For non-Solana addresses, the address should be displayed with chunking
        expect(getByText('1A1z P1eP 5QGe fi2D MPTf TL5S Lmv7 Divf Na')).toBeTruthy();
    });

    it('should handle solana network type correctly', () => {
        const solanaTrade = {
            ...mockExchangeTrade,
            sendAddress: '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM', // Real Solana address
        };

        const { getByText } = renderProviderReceiveAddress(
            solanaTrade,
            'exchange',
            'sol-account-1' as AccountKey, // Todo: create properly via `createAccountKey()`
        );

        // For Solana addresses, the address should be displayed without splitting
        expect(getByText('9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM')).toBeTruthy();
    });

    it('should handle undefined network symbol gracefully', () => {
        const { queryByText } = renderProviderReceiveAddress(
            mockExchangeTrade,
            'exchange',
            'unknown-account-1' as AccountKey, // Todo: create properly via `createAccountKey()`
        );

        // Should not render anything when network symbol is undefined
        expect(queryByText('1A1z P1eP 5QGe fi2D MPTf TL5S Lmv7 Divf Na')).toBeFalsy();
    });
});

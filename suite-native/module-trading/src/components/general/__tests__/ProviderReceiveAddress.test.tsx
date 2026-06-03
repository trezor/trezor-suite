import React from 'react';

import type { ExchangeTrade, SellFiatTrade } from 'invity-api';

import { type AccountKey } from '@suite-common/wallet-types';
import { mockAccountKey } from '@suite-common/wallet-types/mocks';
import { getTranslation } from '@suite-native/intl';
import { renderWithStoreProvider } from '@suite-native/test-utils-store';
import {
    banxaCreditCardSellQuote,
    exchangeMercuryo,
    getWalletState,
    mercuryoFixedWorstQuote,
    sellBanxa,
} from '@suite-native/trading-fixtures';

import { ProviderReceiveAddress } from '../ProviderReceiveAddress';

const receiveAddressLabel = (providerName: string) =>
    getTranslation('moduleTrading.tradingExchangePreviewScreen.providerReceiveAddressLabel', {
        providerName,
    });

const contractAddressLabel = (providerName: string) =>
    getTranslation('moduleTrading.tradingExchangePreviewScreen.providerContractAddressLabel', {
        providerName,
    });

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
        accountKey: AccountKey = mockAccountKey({ symbol: 'btc', descriptor: 'btc1normal' }),
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

        expect(getByText(receiveAddressLabel('Mercuryo'))).toBeOnTheScreen();
        expect(getByText('1A1z P1eP 5QGe fi2D MPTf TL5S Lmv7 Divf Na')).toBeOnTheScreen();
    });

    it('should display provider name and destination address for sell fiat trade', () => {
        const { getByText } = renderProviderReceiveAddress(mockSellFiatTrade, 'sell');

        expect(getByText(receiveAddressLabel('Banxa'))).toBeOnTheScreen();
        expect(getByText('1BvB MSEY stWe tqTF n5Au 4m4G Fg7x JaNV N2')).toBeOnTheScreen();
    });

    it('should display placeholder provider label and address when exchange provider info is missing', () => {
        const walletState = getWalletState({ tradeType: 'exchange' });
        walletState.trading.exchange.exchangeInfo!.providerInfos = {};
        walletState.trading.exchange.tradingAccountKey = mockAccountKey({
            symbol: 'btc',
            descriptor: 'btc1normal',
        });

        const placeholder = getTranslation(
            'moduleTrading.tradingExchangePreviewScreen.providerNamePlaceholder',
        );

        const { getByText } = renderWithStoreProvider(
            <ProviderReceiveAddress trade={mockExchangeTrade} />,
            { preloadedState: { wallet: walletState } },
        );

        expect(getByText(receiveAddressLabel(placeholder))).toBeOnTheScreen();
        expect(getByText('1A1z P1eP 5QGe fi2D MPTf TL5S Lmv7 Divf Na')).toBeOnTheScreen();
    });

    it('should display placeholder provider label and destination address when sell provider info is missing', () => {
        const walletState = getWalletState({ tradeType: 'sell' });
        walletState.trading.sell.sellInfo!.providerInfos = {};
        walletState.trading.sell.tradingAccountKey = mockAccountKey({
            symbol: 'btc',
            descriptor: 'btc1normal',
        });

        const placeholder = getTranslation(
            'moduleTrading.tradingExchangePreviewScreen.providerNamePlaceholder',
        );

        const { getByText } = renderWithStoreProvider(
            <ProviderReceiveAddress trade={mockSellFiatTrade} />,
            { preloadedState: { wallet: walletState } },
        );

        expect(getByText(receiveAddressLabel(placeholder))).toBeOnTheScreen();
        expect(getByText('1BvB MSEY stWe tqTF n5Au 4m4G Fg7x JaNV N2')).toBeOnTheScreen();
    });

    it('should display contract address label for DEX exchange trade', () => {
        const dexTrade: ExchangeTrade = { ...mockExchangeTrade, isDex: true };
        const { getByText } = renderProviderReceiveAddress(dexTrade, 'exchange');

        expect(getByText(contractAddressLabel('Mercuryo'))).toBeOnTheScreen();
        expect(getByText('1A1z P1eP 5QGe fi2D MPTf TL5S Lmv7 Divf Na')).toBeOnTheScreen();
    });

    it('should display address from dexTx when sendAddress is not available', () => {
        const dexTrade: ExchangeTrade = {
            ...mockExchangeTrade,
            isDex: true,
            sendAddress: undefined,
            dexTx: {
                to: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
                from: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
                data: '0x',
                value: '0',
            },
        };
        const { getByText } = renderProviderReceiveAddress(dexTrade, 'exchange');

        expect(getByText(contractAddressLabel('Mercuryo'))).toBeOnTheScreen();
        expect(getByText('1A1z P1eP 5QGe fi2D MPTf TL5S Lmv7 Divf Na')).toBeOnTheScreen();
    });

    it('should render skeleton when receive address is missing for exchange trade', () => {
        const tradeWithoutAddress = { ...mockExchangeTrade, sendAddress: undefined };

        const { getByTestId } = renderProviderReceiveAddress(tradeWithoutAddress, 'exchange');

        expect(getByTestId('@trading/provider-receive-address-skeleton')).toBeOnTheScreen();
    });

    it('should not render anything when destination address is missing for sell fiat trade', () => {
        const tradeWithoutAddress = { ...mockSellFiatTrade, destinationAddress: undefined };

        const { queryByText } = renderProviderReceiveAddress(tradeWithoutAddress, 'sell');

        // User should not see any address information when address is missing
        expect(queryByText(receiveAddressLabel('Banxa'))).toBeNull();
    });

    it('should display ethereum address with chunking for non-solana networks', () => {
        const { getByText } = renderProviderReceiveAddress(
            mockExchangeTrade,
            'exchange',
            mockAccountKey({ symbol: 'eth', descriptor: 'eth1normal' }),
        );

        // For non-Solana addresses, the address should be displayed with chunking
        expect(getByText('1A1z P1eP 5QGe fi2D MPTf TL5S Lmv7 Divf Na')).toBeTruthy();
    });

    it('should display bitcoin address with chunking for non-solana networks', () => {
        const { getByText } = renderProviderReceiveAddress(
            mockExchangeTrade,
            'exchange',
            mockAccountKey({ symbol: 'btc', descriptor: 'btc1normal' }),
        );

        // For non-Solana addresses, the address should be displayed with chunking
        expect(getByText('1A1z P1eP 5QGe fi2D MPTf TL5S Lmv7 Divf Na')).toBeTruthy();
    });

    it('should handle undefined network symbol gracefully', () => {
        const { queryByText } = renderProviderReceiveAddress(
            mockExchangeTrade,
            'exchange',
            mockAccountKey({ descriptor: 'unknownAccount1' }),
        );

        // Should not render anything when network symbol is undefined
        expect(queryByText('1A1z P1eP 5QGe fi2D MPTf TL5S Lmv7 Divf Na')).toBeNull();
    });
});

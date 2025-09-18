import React from 'react';

import { ExchangeTrade, SellFiatTrade } from 'invity-api';

import { isExchangeTrade, selectTradingProviderByNameAndTradeType } from '@suite-common/trading';
import { renderWithStoreProviderAsync } from '@suite-native/test-utils';

import { exchangeMercuryo } from '../../../__fixtures__/exchangeProviders';
import { exchangeQuotes } from '../../../__fixtures__/exchangeQuotes';
import { sellMoonpay } from '../../../__fixtures__/sellProviders';
import { sellQuotes } from '../../../__fixtures__/sellQuotes';
import { ProviderReceiveAddress } from '../ProviderReceiveAddress';

// Mock the trading selector to return provider info
jest.mock('@suite-common/trading', () => ({
    ...jest.requireActual('@suite-common/trading'),
    selectTradingProviderByNameAndTradeType: jest.fn(),
    isExchangeTrade: jest.fn(),
}));

const mockSelectTradingProviderByNameAndTradeType =
    selectTradingProviderByNameAndTradeType as jest.MockedFunction<
        typeof selectTradingProviderByNameAndTradeType
    >;

const mockIsExchangeTrade = isExchangeTrade as jest.MockedFunction<typeof isExchangeTrade>;

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

    const renderProviderReceiveAddress = async (trade: ExchangeTrade | SellFiatTrade) =>
        await renderWithStoreProviderAsync(<ProviderReceiveAddress trade={trade} />);

    beforeEach(() => {
        jest.clearAllMocks();
        // Mock isExchangeTrade to return true for ExchangeTrade and false for SellFiatTrade
        mockIsExchangeTrade.mockImplementation((trade: any) => 'sendAddress' in trade);
    });

    it('should display provider name and receive address for exchange trade', async () => {
        mockSelectTradingProviderByNameAndTradeType.mockReturnValue(exchangeMercuryo);

        const { getByText } = await renderProviderReceiveAddress(mockExchangeTrade);

        // User should see the provider name in the label
        expect(getByText("Mercuryo's receive address")).toBeTruthy();
        // User should see the address split into readable chunks
        expect(getByText('1A1z P1eP 5QGe fi2D MPTf TL5S Lmv7 Divf Na')).toBeTruthy();
    });

    it('should display provider name and destination address for sell fiat trade', async () => {
        mockSelectTradingProviderByNameAndTradeType.mockReturnValue(sellMoonpay);

        const { getByText } = await renderProviderReceiveAddress(mockSellFiatTrade);

        // User should see the provider name in the label
        expect(getByText("MoonPay's receive address")).toBeTruthy();
        // User should see the address split into readable chunks
        expect(getByText('1BvB MSEY stWe tqTF n5Au 4m4G Fg7x JaNV N2')).toBeTruthy();
    });

    it('should show fallback text when provider info is not available', async () => {
        mockSelectTradingProviderByNameAndTradeType.mockReturnValue(undefined);

        const { getByText } = await renderProviderReceiveAddress(mockExchangeTrade);

        // User should see fallback text when provider info is missing
        expect(getByText("Provider's receive address")).toBeTruthy();
    });

    it('should show fallback text when provider company name is not available', async () => {
        mockSelectTradingProviderByNameAndTradeType.mockReturnValue(undefined);

        const { getByText } = await renderProviderReceiveAddress(mockExchangeTrade);

        // User should see fallback text when company name is missing
        expect(getByText("Provider's receive address")).toBeTruthy();
    });

    it('should not render anything when receive address is missing for exchange trade', async () => {
        const tradeWithoutAddress = { ...mockExchangeTrade, sendAddress: undefined };

        mockSelectTradingProviderByNameAndTradeType.mockReturnValue(exchangeMercuryo);

        const { queryByText } = await renderProviderReceiveAddress(tradeWithoutAddress);

        // User should not see any address information when address is missing
        expect(queryByText("Mercuryo's receive address")).toBeFalsy();
    });

    it('should not render anything when destination address is missing for sell fiat trade', async () => {
        const tradeWithoutAddress = { ...mockSellFiatTrade, destinationAddress: undefined };

        mockSelectTradingProviderByNameAndTradeType.mockReturnValue(sellMoonpay);

        const { queryByText } = await renderProviderReceiveAddress(tradeWithoutAddress);

        // User should not see any address information when address is missing
        expect(queryByText("MoonPay's receive address")).toBeFalsy();
    });
});

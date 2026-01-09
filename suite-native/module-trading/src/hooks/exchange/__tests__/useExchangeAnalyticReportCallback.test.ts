import type { CryptoId } from 'invity-api';

import { EventType } from '@suite-native/analytics';
import { useLegacyAnalytics } from '@suite-native/services';
import { PreloadedState, renderHookWithStoreProviderAsync } from '@suite-native/test-utils';
import { exchangeQuotes, getWalletState } from '@suite-native/trading-fixtures';

import { useExchangeAnalyticReportCallback } from '../useExchangeAnalyticReportCallback';

const reportMock = jest.fn();

jest.mock('@suite-native/services', () => {
    const original = jest.requireActual('@suite-native/services');

    return {
        ...original,
        useLegacyAnalytics: jest.fn(),
    };
});

describe('useExchangeAnalyticReportCallback', () => {
    let preloadedState: PreloadedState;

    beforeEach(() => {
        jest.clearAllMocks();

        (useLegacyAnalytics as jest.Mock).mockReturnValue({
            report: reportMock,
        });

        preloadedState = {
            wallet: getWalletState({ tradeType: 'exchange' }),
        };
    });

    it('should call analytics on mount', async () => {
        preloadedState!.wallet!.trading!.exchange!.selectedQuote = exchangeQuotes[0];

        const { result } = await renderHookWithStoreProviderAsync(
            () => useExchangeAnalyticReportCallback(),
            { preloadedState },
        );

        result.current('exchange-form', 'continue');

        expect(reportMock).toHaveBeenCalledWith({
            type: EventType.TradingExchange,
            payload: expect.objectContaining({
                step: 'exchange-form',
                action: 'continue',
                exchangeName: 'mercuryo',
            }),
        });
    });

    it('should work without quote', async () => {
        const { result } = await renderHookWithStoreProviderAsync(
            () => useExchangeAnalyticReportCallback(),
            { preloadedState },
        );

        result.current('exchange-form', 'continue');

        expect(reportMock).toHaveBeenCalledWith({
            type: EventType.TradingExchange,
            payload: {
                step: 'exchange-form',
                action: 'continue',
            },
        });
    });

    it('should allow to specify quote as parameter', async () => {
        preloadedState!.wallet!.trading!.exchange!.selectedQuote = exchangeQuotes[0];

        const { result } = await renderHookWithStoreProviderAsync(
            () => useExchangeAnalyticReportCallback(exchangeQuotes[3]),
            { preloadedState },
        );

        result.current('exchange-form', 'continue');

        expect(reportMock).toHaveBeenCalledWith({
            type: EventType.TradingExchange,
            payload: expect.objectContaining({
                step: 'exchange-form',
                action: 'continue',
                exchangeName: 'invity',
            }),
        });
    });

    it.each([
        [{ ...exchangeQuotes[0], send: 'unknown_cryptoID' as CryptoId }],
        [{ ...exchangeQuotes[0], receive: 'unknown_cryptoID' as CryptoId }],
    ])('should work with unknown quote values', async quote => {
        const { result } = await renderHookWithStoreProviderAsync(
            () => useExchangeAnalyticReportCallback(quote),
            { preloadedState },
        );

        result.current('exchange-form', 'continue');

        expect(reportMock).toHaveBeenCalledWith({
            type: EventType.TradingExchange,
            payload: {
                step: 'exchange-form',
                action: 'continue',
            },
        });
    });
});

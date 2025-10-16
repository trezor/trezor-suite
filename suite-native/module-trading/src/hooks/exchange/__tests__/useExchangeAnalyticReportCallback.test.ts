import type { CryptoId } from 'invity-api';

import { EventType, analytics } from '@suite-native/analytics';
import { PreloadedState, renderHookWithStoreProviderAsync } from '@suite-native/test-utils';

import { exchangeQuotes } from '../../../__fixtures__/exchangeQuotes';
import { getWalletState } from '../../../__fixtures__/walletState';
import { useExchangeAnalyticReportCallback } from '../useExchangeAnalyticReportCallback';

describe('useExchangeAnalyticReportCallback', () => {
    let preloadedState: PreloadedState;
    let analyticsSpy: jest.SpyInstance;

    beforeEach(() => {
        jest.clearAllMocks();

        preloadedState = {
            wallet: getWalletState({ tradeType: 'exchange' }),
        };
        analyticsSpy = jest.spyOn(analytics, 'report');
    });

    it('should call analytics on mount', async () => {
        preloadedState!.wallet!.trading!.exchange!.selectedQuote = exchangeQuotes[0];

        const { result } = await renderHookWithStoreProviderAsync(
            () => useExchangeAnalyticReportCallback(),
            { preloadedState },
        );

        result.current('exchange-form', 'continue');

        expect(analyticsSpy).toHaveBeenCalledWith({
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

        expect(analyticsSpy).toHaveBeenCalledWith({
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

        expect(analyticsSpy).toHaveBeenCalledWith({
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

        expect(analyticsSpy).toHaveBeenCalledWith({
            type: EventType.TradingExchange,
            payload: {
                step: 'exchange-form',
                action: 'continue',
            },
        });
    });
});

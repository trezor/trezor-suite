import type { CryptoId } from 'invity-api';

import { events } from '@suite-native/analytics';
import { useAnalytics } from '@suite-native/services';
// eslint-disable-next-line local-rules/no-package-deep-imports
import { PreloadedState, renderHookWithStoreProvider } from '@suite-native/test-utils/store';
import { exchangeQuotes, getWalletState } from '@suite-native/trading-fixtures';

import { useExchangeAnalyticReportCallback } from '../useExchangeAnalyticReportCallback';

const reportMock = jest.fn();

jest.mock('@suite-native/services', () => {
    const original = jest.requireActual('@suite-native/services');

    return {
        ...original,
        useAnalytics: jest.fn(),
    };
});

describe('useExchangeAnalyticReportCallback', () => {
    let preloadedState: PreloadedState;

    beforeEach(() => {
        jest.clearAllMocks();

        (useAnalytics as jest.Mock).mockReturnValue({
            report: reportMock,
        });

        preloadedState = {
            wallet: getWalletState({ tradeType: 'exchange' }),
        };
    });

    it('should call analytics on mount', () => {
        preloadedState!.wallet!.trading!.exchange!.selectedQuote = exchangeQuotes[0];

        const { result } = renderHookWithStoreProvider(() => useExchangeAnalyticReportCallback(), {
            preloadedState,
        });

        result.current('exchange-form', 'continue');

        expect(reportMock).toHaveBeenCalledWith({
            type: events.tradingExchangeEvent.name,
            payload: expect.objectContaining({
                step: 'exchange-form',
                action: 'continue',
                exchangeName: 'mercuryo',
            }),
        });
    });

    it('should work without quote', () => {
        const { result } = renderHookWithStoreProvider(() => useExchangeAnalyticReportCallback(), {
            preloadedState,
        });

        result.current('exchange-form', 'continue');

        expect(reportMock).toHaveBeenCalledWith({
            type: events.tradingExchangeEvent.name,
            payload: {
                step: 'exchange-form',
                action: 'continue',
            },
        });
    });

    it('should allow to specify quote as parameter', () => {
        preloadedState!.wallet!.trading!.exchange!.selectedQuote = exchangeQuotes[0];

        const { result } = renderHookWithStoreProvider(
            () => useExchangeAnalyticReportCallback(exchangeQuotes[3]),
            { preloadedState },
        );

        result.current('exchange-form', 'continue');

        expect(reportMock).toHaveBeenCalledWith({
            type: events.tradingExchangeEvent.name,
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
    ])('should work with unknown quote values', quote => {
        const { result } = renderHookWithStoreProvider(
            () => useExchangeAnalyticReportCallback(quote),
            { preloadedState },
        );

        result.current('exchange-form', 'continue');

        expect(reportMock).toHaveBeenCalledWith({
            type: events.tradingExchangeEvent.name,
            payload: {
                step: 'exchange-form',
                action: 'continue',
            },
        });
    });
});

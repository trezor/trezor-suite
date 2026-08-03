import type { CryptoId } from 'invity-api';

import { type NativeAnalyticsDep, events } from '@suite-native/analytics';
import { mockNativeAnalytics } from '@suite-native/analytics/mocks';
import {
    type PreloadedStatePartial,
    mergePreloadedState,
    renderHookWithStoreProvider,
} from '@suite-native/test-utils-store';
import {
    getWalletState,
    invityDexQuote,
    mercuryoFixedWorstQuote,
} from '@suite-native/trading-fixtures';

import { useExchangeAnalyticReportCallback } from './useExchangeAnalyticReportCallback';

const reportMock = jest.fn();
const services: NativeAnalyticsDep = {
    analytics: mockNativeAnalytics(reportMock),
};

describe('useExchangeAnalyticReportCallback', () => {
    type ExchangeAnalyticsPreloadedState = {
        wallet: ReturnType<typeof getWalletState>;
    };

    const createPreloadedState = (
        overrides: PreloadedStatePartial<ExchangeAnalyticsPreloadedState> = {},
    ): ExchangeAnalyticsPreloadedState =>
        mergePreloadedState({ wallet: getWalletState({ tradeType: 'exchange' }) }, overrides);

    const renderUseExchangeAnalyticReportCallback = ({
        candidateQuote: initialCandidateQuote,
        preloadedState = createPreloadedState(),
    }: {
        candidateQuote?: Parameters<typeof useExchangeAnalyticReportCallback>[0];
        preloadedState?: ExchangeAnalyticsPreloadedState;
    } = {}) =>
        renderHookWithStoreProvider(
            ({ candidateQuote }) => useExchangeAnalyticReportCallback(candidateQuote),
            {
                preloadedState,
                services,
                initialProps: {
                    candidateQuote: initialCandidateQuote,
                },
            },
        );

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should call analytics on mount', () => {
        const { result } = renderUseExchangeAnalyticReportCallback({
            preloadedState: createPreloadedState({
                wallet: {
                    trading: {
                        exchange: {
                            selectedQuote: mercuryoFixedWorstQuote,
                        },
                    },
                },
            }),
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
        const { result } = renderUseExchangeAnalyticReportCallback();

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
        const { result } = renderUseExchangeAnalyticReportCallback({
            candidateQuote: invityDexQuote,
            preloadedState: createPreloadedState({
                wallet: {
                    trading: {
                        exchange: {
                            selectedQuote: mercuryoFixedWorstQuote,
                        },
                    },
                },
            }),
        });

        result.current('exchange-form', 'continue');

        expect(reportMock).toHaveBeenCalledWith({
            type: events.tradingExchangeEvent.name,
            payload: expect.objectContaining({
                step: 'exchange-form',
                action: 'continue',
                exchangeName: 'invity',
            }),
        });
        expect(reportMock.mock.calls[0][0].payload).not.toHaveProperty('simulationResult');
    });

    it.each([
        [{ ...mercuryoFixedWorstQuote, send: 'unknown_cryptoID' as CryptoId }],
        [{ ...mercuryoFixedWorstQuote, receive: 'unknown_cryptoID' as CryptoId }],
    ])('should work with unknown quote values', quote => {
        const { result } = renderUseExchangeAnalyticReportCallback({
            candidateQuote: quote,
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

    it('should be stable even when quote changes', () => {
        const { result, rerender } = renderUseExchangeAnalyticReportCallback({
            candidateQuote: mercuryoFixedWorstQuote,
        });
        const firstCallback = result.current;

        rerender({ candidateQuote: invityDexQuote });

        expect(result.current).toBe(firstCallback);
    });
});

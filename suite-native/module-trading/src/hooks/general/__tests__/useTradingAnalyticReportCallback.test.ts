import {
    EventType,
    TradingExchangeAction,
    TradingExchangeStep,
    TradingSellAction,
    TradingSellStep,
} from '@suite-native/analytics';
import { useAnalytics } from '@suite-native/services';
import { PreloadedState, renderHookWithStoreProviderAsync } from '@suite-native/test-utils';
import { exchangeQuotes, getWalletState, sellQuotes } from '@suite-native/trading-fixtures';

import { useTradingAnalyticReportCallback } from '../useTradingAnalyticReportCallback';

const reportMock = jest.fn();

jest.mock('@suite-native/services', () => {
    const original = jest.requireActual('@suite-native/services');

    return {
        ...original,
        useAnalytics: jest.fn(),
    };
});

describe('useTradingAnalyticReportCallback', () => {
    let preloadedState: PreloadedState;

    beforeEach(() => {
        jest.clearAllMocks();

        (useAnalytics as jest.Mock).mockReturnValue({
            report: reportMock,
        });
    });

    describe('when tradingType is "sell"', () => {
        beforeEach(() => {
            preloadedState = {
                wallet: getWalletState({ tradeType: 'sell' }),
            };
            preloadedState.wallet!.trading!.sell!.selectedQuote = sellQuotes[0];
        });

        it('should return sell analytics callback', async () => {
            const { result } = await renderHookWithStoreProviderAsync(
                () => useTradingAnalyticReportCallback('sell'),
                { preloadedState },
            );

            (result.current as (step: TradingSellStep, action: TradingSellAction) => void)(
                'sell-form',
                'visit',
            );

            expect(reportMock).toHaveBeenCalledWith({
                type: EventType.TradingSell,
                payload: expect.objectContaining({
                    step: 'sell-form',
                    action: 'visit',
                }),
            });
        });
    });

    describe('when tradingType is "exchange"', () => {
        beforeEach(() => {
            preloadedState = {
                wallet: getWalletState({ tradeType: 'exchange' }),
            };
            preloadedState.wallet!.trading!.exchange!.selectedQuote = exchangeQuotes[0];
        });

        it('should return exchange analytics callback', async () => {
            const { result } = await renderHookWithStoreProviderAsync(
                () => useTradingAnalyticReportCallback('exchange'),
                { preloadedState },
            );

            (result.current as (step: TradingExchangeStep, action: TradingExchangeAction) => void)(
                'exchange-form',
                'continue',
            );

            expect(reportMock).toHaveBeenCalledWith({
                type: EventType.TradingExchange,
                payload: expect.objectContaining({
                    step: 'exchange-form',
                    action: 'continue',
                    exchangeName: 'mercuryo',
                }),
            });
        });
    });

    describe('when tradingType is undefined', () => {
        beforeEach(() => {
            preloadedState = {
                wallet: getWalletState({ tradeType: 'exchange' }),
            };
        });

        it('should return null action (no analytics)', async () => {
            const { result } = await renderHookWithStoreProviderAsync(
                () => useTradingAnalyticReportCallback(undefined),
                { preloadedState },
            );

            result.current('fee-selection', 'visit');

            expect(reportMock).not.toHaveBeenCalled();
        });
    });

    describe('when tradingType is "buy"', () => {
        beforeEach(() => {
            preloadedState = {
                wallet: getWalletState({ tradeType: 'buy' }),
            };
        });

        it('should return null action (no analytics)', async () => {
            const { result } = await renderHookWithStoreProviderAsync(
                () => useTradingAnalyticReportCallback('buy'),
                { preloadedState },
            );

            result.current('fee-selection', 'visit');

            expect(reportMock).not.toHaveBeenCalled();
        });
    });
});

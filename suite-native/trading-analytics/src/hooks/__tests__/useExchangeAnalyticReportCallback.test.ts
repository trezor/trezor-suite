import type { CryptoId } from 'invity-api';

import { events } from '@suite-native/analytics';
import { useAnalytics } from '@suite-native/services';
import { type PreloadedState, renderHookWithStoreProvider } from '@suite-native/test-utils-store';
import {
    getWalletState,
    invityDexQuote,
    mercuryoFixedWorstQuote,
} from '@suite-native/trading-fixtures';

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
        preloadedState!.wallet!.trading!.exchange!.selectedQuote = mercuryoFixedWorstQuote;

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
        preloadedState!.wallet!.trading!.exchange!.selectedQuote = mercuryoFixedWorstQuote;

        const { result } = renderHookWithStoreProvider(
            () => useExchangeAnalyticReportCallback(invityDexQuote),
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
        [{ ...mercuryoFixedWorstQuote, send: 'unknown_cryptoID' as CryptoId }],
        [{ ...mercuryoFixedWorstQuote, receive: 'unknown_cryptoID' as CryptoId }],
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

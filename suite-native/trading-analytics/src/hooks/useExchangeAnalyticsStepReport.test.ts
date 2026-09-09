import { events } from '@suite-native/analytics';
import { mockNativeAnalytics } from '@suite-native/analytics/mocks';
import { renderHookWithStoreProvider } from '@suite-native/test-utils-store';
import { getWalletState } from '@suite-native/trading-fixtures';

import { useExchangeAnalyticsStepReport } from './useExchangeAnalyticsStepReport';

const reportToAnalyticsMock = jest.fn();

describe('useExchangeAnalyticsStepReport', () => {
    const preloadedState = { wallet: getWalletState({ tradeType: 'exchange' }) };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should report correct data on callback execution', async () => {
        const { result } = await renderHookWithStoreProvider(
            () => useExchangeAnalyticsStepReport('exchange-form'),
            { preloadedState, services: { analytics: mockNativeAnalytics(reportToAnalyticsMock) } },
        );

        result.current('visit');
        result.current('retry');
        result.current('visit');

        expect(reportToAnalyticsMock).toHaveBeenCalledTimes(3);
        expect(reportToAnalyticsMock).toHaveBeenNthCalledWith(1, {
            type: events.tradingExchangeEvent.name,
            payload: expect.objectContaining({ step: 'exchange-form', action: 'visit' }),
        });
        expect(reportToAnalyticsMock).toHaveBeenNthCalledWith(2, {
            type: events.tradingExchangeEvent.name,
            payload: expect.objectContaining({ step: 'exchange-form', action: 'retry' }),
        });
        expect(reportToAnalyticsMock).toHaveBeenNthCalledWith(3, {
            type: events.tradingExchangeEvent.name,
            payload: expect.objectContaining({ step: 'exchange-form', action: 'visit' }),
        });
    });
});

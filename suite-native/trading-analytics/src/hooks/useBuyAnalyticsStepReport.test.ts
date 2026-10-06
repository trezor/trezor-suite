import { events } from '@suite-native/analytics';
import { mockNativeAnalytics } from '@suite-native/analytics/mocks';
import { renderHookWithStoreProvider } from '@suite-native/test-utils-store';
import { getWalletState } from '@suite-native/trading-fixtures';

import { useBuyAnalyticsStepReport } from './useBuyAnalyticsStepReport';

const reportToAnalyticsMock = jest.fn();

describe('useBuyAnalyticsStepReport', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should pass the step and action to the underlying callback', async () => {
        const { result } = await renderHookWithStoreProvider(
            () => useBuyAnalyticsStepReport('buy-preview'),
            {
                preloadedState: { wallet: getWalletState({ tradeType: 'buy' }) },
                services: { analytics: mockNativeAnalytics(reportToAnalyticsMock) },
            },
        );

        result.current('visit');
        result.current('continue');
        result.current('visit');

        expect(reportToAnalyticsMock).toHaveBeenCalledTimes(3);
        expect(reportToAnalyticsMock).toHaveBeenNthCalledWith(1, {
            type: events.tradingBuyEvent.name,
            payload: expect.objectContaining({ step: 'buy-preview', action: 'visit' }),
        });
        expect(reportToAnalyticsMock).toHaveBeenNthCalledWith(2, {
            type: events.tradingBuyEvent.name,
            payload: expect.objectContaining({ step: 'buy-preview', action: 'continue' }),
        });
        expect(reportToAnalyticsMock).toHaveBeenNthCalledWith(3, {
            type: events.tradingBuyEvent.name,
            payload: expect.objectContaining({ step: 'buy-preview', action: 'visit' }),
        });
    });
});

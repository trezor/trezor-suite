import { renderHookWithStoreProvider } from '@suite-native/test-utils-store';
import { getWalletState } from '@suite-native/trading-fixtures';

import { useExchangeAnalyticsStepReport } from './useExchangeAnalyticsStepReport';

const reportToAnalyticsMock = jest.fn();

jest.mock('./useExchangeAnalyticReportCallback', () => ({
    useExchangeAnalyticReportCallback: jest.fn(() => reportToAnalyticsMock),
}));

describe('useExchangeAnalyticsStepReport', () => {
    const preloadedState = { wallet: getWalletState({ tradeType: 'exchange' }) };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should report correct data on callback execution', async () => {
        const { result } = await renderHookWithStoreProvider(
            () => useExchangeAnalyticsStepReport('exchange-form'),
            { preloadedState },
        );

        result.current('visit');
        result.current('retry');
        result.current('visit');

        expect(reportToAnalyticsMock).toHaveBeenCalledTimes(3);
        expect(reportToAnalyticsMock).toHaveBeenNthCalledWith(1, 'exchange-form', 'visit');
        expect(reportToAnalyticsMock).toHaveBeenNthCalledWith(2, 'exchange-form', 'retry');
        expect(reportToAnalyticsMock).toHaveBeenNthCalledWith(3, 'exchange-form', 'visit');
    });
});

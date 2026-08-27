import { renderHookWithBasicProvider } from '@suite-native/test-utils';

import { useBuyAnalyticsStepReport } from './useBuyAnalyticsStepReport';

const reportToAnalyticsMock = jest.fn();

jest.mock('./useBuyAnalyticReportCallback', () => ({
    useBuyAnalyticReportCallback: jest.fn(() => reportToAnalyticsMock),
}));

describe('useBuyAnalyticsStepReport', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should pass the step and action to the underlying callback', async () => {
        const { result } = await renderHookWithBasicProvider(() =>
            useBuyAnalyticsStepReport('buy-preview'),
        );

        result.current('visit');
        result.current('continue');
        result.current('visit');

        expect(reportToAnalyticsMock).toHaveBeenCalledTimes(3);
        expect(reportToAnalyticsMock).toHaveBeenNthCalledWith(1, 'buy-preview', 'visit');
        expect(reportToAnalyticsMock).toHaveBeenNthCalledWith(2, 'buy-preview', 'continue');
        expect(reportToAnalyticsMock).toHaveBeenNthCalledWith(3, 'buy-preview', 'visit');
    });
});

import { type NativeAnalyticsDep, events } from '@suite-native/analytics';
import { mockNativeAnalytics } from '@suite-native/analytics/mocks';
import { act, renderHookWithBasicProvider } from '@suite-native/test-utils';

import { useExchangeIssueAnalyticReportCallback } from './useExchangeIssueAnalyticReportCallback';

describe('useExchangeIssueAnalyticReportCallback', () => {
    const reportMock = jest.fn();
    const services: NativeAnalyticsDep = {
        analytics: mockNativeAnalytics(reportMock),
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('reports an exchange issue', async () => {
        const { result } = await renderHookWithBasicProvider(
            () => useExchangeIssueAnalyticReportCallback(),
            { services },
        );

        await act(() => {
            result.current('high-risk', true);
        });

        expect(reportMock).toHaveBeenCalledTimes(1);
        expect(reportMock).toHaveBeenCalledWith({
            type: events.tradingExchangeIssueEvent.name,
            payload: {
                issue: 'high-risk',
                isSimulation: true,
            },
        });
    });
});

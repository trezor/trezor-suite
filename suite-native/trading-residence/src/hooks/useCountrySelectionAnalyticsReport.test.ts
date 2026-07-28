import { type NativeAnalyticsDep, events } from '@suite-native/analytics';
import { mockNativeAnalytics } from '@suite-native/analytics/mocks';
import { act, renderHookWithBasicProvider } from '@suite-native/test-utils';

import { useCountrySelectionAnalyticsReport } from './useCountrySelectionAnalyticsReport';

describe('useCountrySelectionAnalyticsReport', () => {
    const reportMock = jest.fn();
    const services: NativeAnalyticsDep = {
        analytics: mockNativeAnalytics(reportMock),
    };

    const renderUseCountrySelectionAnalyticsReport = () =>
        renderHookWithBasicProvider(() => useCountrySelectionAnalyticsReport(), { services });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should report event to analytics', () => {
        const { result } = renderUseCountrySelectionAnalyticsReport();

        act(() => {
            result.current('submitCustom');
        });

        expect(reportMock).toHaveBeenCalledTimes(1);
        expect(reportMock).toHaveBeenCalledWith({
            type: events.tradingCountrySelectionEvent.name,
            payload: {
                type: 'settings',
                action: 'submitCustom',
            },
        });
    });
});

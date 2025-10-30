import { EventType, analytics } from '@suite-native/analytics';
import { act, renderHookWithBasicProvider } from '@suite-native/test-utils';

import { useCountrySelectionAnalyticsReport } from '../useCountrySelectionAnalyticsReport';

describe('useCountrySelectionAnalyticsReport', () => {
    const renderUseCountrySelectionAnalyticsReport = () =>
        renderHookWithBasicProvider(() => useCountrySelectionAnalyticsReport());

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should report event to analytics', () => {
        const reportSpy = jest.spyOn(analytics, 'report');
        const { result } = renderUseCountrySelectionAnalyticsReport();

        act(() => {
            result.current('submitCustom');
        });

        expect(reportSpy).toHaveBeenCalledTimes(1);
        expect(reportSpy).toHaveBeenCalledWith({
            type: EventType.TradingCountrySelection,
            payload: {
                type: 'settings',
                action: 'submitCustom',
            },
        });
    });
});

import { EventType } from '@suite-native/analytics';
import { useLegacyAnalytics } from '@suite-native/services';
import { act, renderHookWithBasicProvider } from '@suite-native/test-utils';

import { useCountrySelectionAnalyticsReport } from '../useCountrySelectionAnalyticsReport';

jest.mock('@suite-native/services', () => {
    const original = jest.requireActual('@suite-native/services');

    return {
        ...original,
        useLegacyAnalytics: jest.fn(),
    };
});

describe('useCountrySelectionAnalyticsReport', () => {
    const reportMock = jest.fn();

    const renderUseCountrySelectionAnalyticsReport = () =>
        renderHookWithBasicProvider(() => useCountrySelectionAnalyticsReport());

    beforeEach(() => {
        jest.clearAllMocks();

        (useLegacyAnalytics as jest.Mock).mockReturnValue({
            report: reportMock,
        });
    });

    it('should report event to analytics', () => {
        const { result } = renderUseCountrySelectionAnalyticsReport();

        act(() => {
            result.current('submitCustom');
        });

        expect(reportMock).toHaveBeenCalledTimes(1);
        expect(reportMock).toHaveBeenCalledWith({
            type: EventType.TradingCountrySelection,
            payload: {
                type: 'settings',
                action: 'submitCustom',
            },
        });
    });
});

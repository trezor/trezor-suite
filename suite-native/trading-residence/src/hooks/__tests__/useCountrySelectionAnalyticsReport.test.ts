import { events } from '@suite-native/analytics';
import { useAnalytics } from '@suite-native/services';
import { act, renderHookWithProviders } from '@suite-native/test-utils';

import { useCountrySelectionAnalyticsReport } from '../useCountrySelectionAnalyticsReport';

jest.mock('@suite-native/services', () => {
    const original = jest.requireActual('@suite-native/services');

    return {
        ...original,
        useAnalytics: jest.fn(),
    };
});

describe('useCountrySelectionAnalyticsReport', () => {
    const reportMock = jest.fn();

    const renderUseCountrySelectionAnalyticsReport = () =>
        renderHookWithProviders(() => useCountrySelectionAnalyticsReport(), {
            providers: ['intl'],
        });

    beforeEach(() => {
        jest.clearAllMocks();

        (useAnalytics as jest.Mock).mockReturnValue({
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
            type: events.tradingCountrySelectionEvent.name,
            payload: {
                type: 'settings',
                action: 'submitCustom',
            },
        });
    });
});

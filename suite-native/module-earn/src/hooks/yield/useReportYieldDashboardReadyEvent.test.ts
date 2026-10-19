import { type NativeAnalyticsDep } from '@suite-native/analytics';
import { mockNativeAnalytics } from '@suite-native/analytics/mocks';
import { act, renderHookWithStoreProvider } from '@suite-native/test-utils-store';

import { useReportYieldDashboardReadyEvent } from './useReportYieldDashboardReadyEvent';

type Props = Parameters<typeof useReportYieldDashboardReadyEvent>[0];
const readyProps = {
    yieldOpportunities: [],
    isLoading: false,
    isError: false,
    positionsCount: 1,
    claimItemsCount: 1,
};

const renderDashboardAnalytics = async (initialProps: Props) => {
    const services: NativeAnalyticsDep = { analytics: mockNativeAnalytics(jest.fn()) };
    const view = await renderHookWithStoreProvider(useReportYieldDashboardReadyEvent, {
        initialProps,
        services,
    });

    return { ...view, analytics: services.analytics };
};

describe('useReportYieldDashboardReadyEvent', () => {
    it('waits for data before reporting', async () => {
        const { analytics, rerender } = await renderDashboardAnalytics({
            ...readyProps,
            isLoading: true,
        });
        expect(analytics.report).not.toHaveBeenCalled();
        await act(async () => {
            await rerender(readyProps);
        });
        expect(analytics.report).toHaveBeenCalledTimes(1);
        expect(analytics.report).toHaveBeenCalledWith({
            type: 'yield/earn-dashboard-ready',
            payload: { hasClaimBanner: true, hasActivePosition: true, availableVaultCount: 0 },
        });
    });

    it('does not report failed requests as a ready dashboard with empty data', async () => {
        const { analytics, rerender } = await renderDashboardAnalytics({
            ...readyProps,
            isError: true,
        });
        expect(analytics.report).not.toHaveBeenCalled();
        await act(async () => {
            await rerender(readyProps);
        });
        expect(analytics.report).toHaveBeenCalledTimes(1);
    });

    it('reports only once per mount even when positions or rewards change', async () => {
        const { analytics, rerender } = await renderDashboardAnalytics(readyProps);
        await act(async () => {
            await rerender({ ...readyProps, positionsCount: 0, claimItemsCount: 0 });
        });
        expect(analytics.report).toHaveBeenCalledTimes(1);
    });
});

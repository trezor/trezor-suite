import { asNetworkSymbol } from '@suite-common/wallet-config';
import { type NativeAnalyticsDep } from '@suite-native/analytics';
import { mockNativeAnalytics } from '@suite-native/analytics/mocks';
import { act, renderHookWithStoreProvider } from '@suite-native/test-utils-store';
import { mock } from '@trezor/dependency-injection';

import { useReportEarnDashboardReadyEvent } from './useReportEarnDashboardReadyEvent';
import { selectStakingPromoListSymbols } from '../../earnScreenSelectors';

let mockIsFocused = true;
let mockEntryId = 1;

jest.mock('../../earnScreenSelectors', () => ({
    ...jest.requireActual('../../earnScreenSelectors'),
    selectStakingPromoListSymbols: jest.fn(),
}));

jest.mock('@suite-native/navigation', () => ({
    ...jest.requireActual('@suite-native/navigation'),
    useEarnEntryId: () => mockEntryId,
}));

jest.mock('@react-navigation/native', () => ({
    ...jest.requireActual('@react-navigation/native'),
    useIsFocused: () => mockIsFocused,
}));

type Props = Parameters<typeof useReportEarnDashboardReadyEvent>[0];
const readyProps = {
    yieldOpportunities: [],
    isLoading: false,
    isError: false,
    yieldPositionsCount: 1,
    stakingPositionsCount: 1,
    claimItemsCount: 1,
    isStakingDisabled: false,
    isYieldDisabled: false,
};

const renderDashboardAnalytics = async (initialProps: Props) => {
    const services: NativeAnalyticsDep = {
        analytics: mockNativeAnalytics(mock<NativeAnalyticsDep['analytics']['report']>()),
    };
    const view = await renderHookWithStoreProvider(useReportEarnDashboardReadyEvent, {
        initialProps,
        services,
    });

    return { ...view, analytics: services.analytics };
};

describe('useReportEarnDashboardReadyEvent', () => {
    it('waits until an entry has been reported before reporting ready', async () => {
        mockEntryId = 0;
        const { analytics, rerender } = await renderDashboardAnalytics(readyProps);
        expect(analytics.report).not.toHaveBeenCalled();

        mockEntryId = 1;
        await rerender(readyProps);
        expect(analytics.report).toHaveBeenCalledTimes(1);
    });

    it('re-arms on the entry id even when no intermediate blur render was observed', async () => {
        const { analytics, rerender } = await renderDashboardAnalytics(readyProps);

        mockEntryId = 2;
        await rerender(readyProps);

        expect(analytics.report).toHaveBeenCalledTimes(2);
    });

    beforeEach(() => {
        mockIsFocused = true;
        mockEntryId = 1;
        jest.mocked(selectStakingPromoListSymbols).mockReturnValue([
            asNetworkSymbol('eth'),
            asNetworkSymbol('ada'),
        ]);
    });

    it('does not count closing an overlay as another ready dashboard', async () => {
        const { analytics, rerender } = await renderDashboardAnalytics(readyProps);

        mockIsFocused = false;
        await rerender(readyProps);
        mockIsFocused = true;
        await rerender(readyProps);

        expect(analytics.report).toHaveBeenCalledTimes(1);
    });

    it('reports once again on re-entry and never while the dashboard is hidden', async () => {
        const { analytics, rerender } = await renderDashboardAnalytics(readyProps);

        mockIsFocused = false;
        await rerender(readyProps);
        await rerender({ ...readyProps, yieldPositionsCount: 0 });
        expect(analytics.report).toHaveBeenCalledTimes(1);

        mockIsFocused = true;
        mockEntryId = 2;
        await rerender(readyProps);
        await rerender(readyProps);
        expect(analytics.report).toHaveBeenCalledTimes(2);
    });

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
            type: 'earn/dashboard-ready',
            payload: {
                hasClaimBanner: true,
                hasYieldPosition: true,
                hasStakingPosition: true,
                availableVaultCount: 0,
                availableStakingCount: 2,
                hasShowMore: false,
            },
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
            await rerender({ ...readyProps, yieldPositionsCount: 0, claimItemsCount: 0 });
        });
        expect(analytics.report).toHaveBeenCalledTimes(1);
    });

    it('does not count positions or opportunities from disabled sections', async () => {
        const { analytics } = await renderDashboardAnalytics({
            ...readyProps,
            isStakingDisabled: true,
            isYieldDisabled: true,
        });

        expect(analytics.report).toHaveBeenCalledWith({
            type: 'earn/dashboard-ready',
            payload: {
                hasClaimBanner: false,
                hasYieldPosition: false,
                hasStakingPosition: false,
                availableVaultCount: 0,
                availableStakingCount: 0,
                hasShowMore: false,
            },
        });
    });
});

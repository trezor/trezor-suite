import { type NativeAnalyticsDep } from '@suite-native/analytics';
import { mockNativeAnalytics } from '@suite-native/analytics/mocks';
import { act, renderHookWithBasicProvider } from '@suite-native/test-utils';

import { useReportEnsResolutionToAnalytics } from './useReportEnsResolutionToAnalytics';

type ReportingHookProps = Parameters<typeof useReportEnsResolutionToAnalytics>[0];

const renderReportingHook = async (props: ReportingHookProps) => {
    const services: NativeAnalyticsDep = {
        analytics: mockNativeAnalytics(jest.fn()),
    };

    const view = await renderHookWithBasicProvider(useReportEnsResolutionToAnalytics, {
        initialProps: props,
        services,
    });

    return { ...view, analytics: services.analytics };
};

const settledNameLookup = {
    symbol: 'eth',
    mode: 'forward',
    isFetching: false,
    isSuccess: true,
    isError: false,
} as const satisfies ReportingHookProps;

const settledAddressLookup = { ...settledNameLookup, mode: 'reverse' } as const;

describe(useReportEnsResolutionToAnalytics.name, () => {
    it('reports a name the user typed as a direct resolution', async () => {
        const { analytics } = await renderReportingHook(settledNameLookup);

        expect(analytics.report).toHaveBeenCalledTimes(1);
        expect(analytics.report).toHaveBeenCalledWith({
            type: 'send/ens-resolution',
            payload: { assetSymbol: 'eth', direction: 'direct' },
        });
    });

    it('reports an address the user typed as a reverse resolution', async () => {
        const { analytics } = await renderReportingHook(settledAddressLookup);

        expect(analytics.report).toHaveBeenCalledWith({
            type: 'send/ens-resolution',
            payload: { assetSymbol: 'eth', direction: 'reverse' },
        });
    });

    it('reports a lookup that failed, since it ran all the same', async () => {
        const { analytics } = await renderReportingHook({
            ...settledNameLookup,
            isSuccess: false,
            isError: true,
        });

        expect(analytics.report).toHaveBeenCalledWith({
            type: 'send/ens-resolution',
            payload: { assetSymbol: 'eth', direction: 'direct' },
        });
    });

    it('reports nothing while a lookup is in flight', async () => {
        const { analytics } = await renderReportingHook({
            ...settledNameLookup,
            isFetching: true,
        });

        expect(analytics.report).not.toHaveBeenCalled();
    });

    it('reports nothing before a lookup settles', async () => {
        const { analytics } = await renderReportingHook({
            ...settledNameLookup,
            isSuccess: false,
        });

        expect(analytics.report).not.toHaveBeenCalled();
    });

    it('reports nothing when there is nothing to resolve', async () => {
        const { analytics } = await renderReportingHook({ ...settledNameLookup, mode: 'idle' });

        expect(analytics.report).not.toHaveBeenCalled();
    });

    it('reports nothing without a network to attribute the resolution to', async () => {
        const { analytics } = await renderReportingHook({ ...settledNameLookup, symbol: null });

        expect(analytics.report).not.toHaveBeenCalled();
    });

    it('reports a direction once, however many lookups run in it', async () => {
        const { rerender, analytics } = await renderReportingHook(settledNameLookup);

        await act(async () => {
            await rerender({ ...settledNameLookup, isFetching: true });
        });

        await act(async () => {
            await rerender(settledNameLookup);
        });

        expect(analytics.report).toHaveBeenCalledTimes(1);
    });

    it('reports both directions when the user uses both', async () => {
        const { rerender, analytics } = await renderReportingHook(settledNameLookup);

        await act(async () => {
            await rerender(settledAddressLookup);
        });

        expect(analytics.report).toHaveBeenCalledTimes(2);
        expect(analytics.report).toHaveBeenLastCalledWith({
            type: 'send/ens-resolution',
            payload: { assetSymbol: 'eth', direction: 'reverse' },
        });
    });
});

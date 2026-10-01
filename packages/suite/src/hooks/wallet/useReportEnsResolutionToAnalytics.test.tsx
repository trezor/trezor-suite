import { type PropsWithChildren } from 'react';

import { act, renderHook } from '@testing-library/react';

import { type DesktopAnalyticsDep } from '@suite/analytics';
import { mockDesktopAnalytics } from '@suite/analytics/mocks';
import { ServicesProvider } from '@suite-common/dependency-injection';
import { asNetworkSymbol } from '@suite-common/wallet-config';

import { useReportEnsResolutionToAnalytics } from './useReportEnsResolutionToAnalytics';

type ReportingHookProps = Parameters<typeof useReportEnsResolutionToAnalytics>[0];

const renderReportingHook = (initialProps: ReportingHookProps) => {
    const services: DesktopAnalyticsDep = { analytics: mockDesktopAnalytics(jest.fn()) };

    const view = renderHook(
        (props: ReportingHookProps) => useReportEnsResolutionToAnalytics(props),
        {
            initialProps,
            wrapper: ({ children }: PropsWithChildren) => (
                <ServicesProvider services={services}>{children}</ServicesProvider>
            ),
        },
    );

    return { ...view, analytics: services.analytics };
};

const settledNameLookup = {
    symbol: asNetworkSymbol('eth'),
    mode: 'forward',
    isFetching: false,
    isSuccess: true,
    isError: false,
} as const satisfies ReportingHookProps;

const settledAddressLookup = { ...settledNameLookup, mode: 'reverse' } as const;

describe(useReportEnsResolutionToAnalytics.name, () => {
    it('reports a name the user typed as a direct resolution', () => {
        const { analytics } = renderReportingHook(settledNameLookup);

        expect(analytics.report).toHaveBeenCalledTimes(1);
        expect(analytics.report).toHaveBeenCalledWith({
            type: 'send/ens-resolution',
            payload: { assetSymbol: 'eth', direction: 'direct' },
        });
    });

    it('reports an address the user typed as a reverse resolution', () => {
        const { analytics } = renderReportingHook(settledAddressLookup);

        expect(analytics.report).toHaveBeenCalledWith({
            type: 'send/ens-resolution',
            payload: { assetSymbol: 'eth', direction: 'reverse' },
        });
    });

    it('reports a lookup that failed, since it ran all the same', () => {
        const { analytics } = renderReportingHook({
            ...settledNameLookup,
            isSuccess: false,
            isError: true,
        });

        expect(analytics.report).toHaveBeenCalledWith({
            type: 'send/ens-resolution',
            payload: { assetSymbol: 'eth', direction: 'direct' },
        });
    });

    it('reports nothing while a lookup is in flight', () => {
        const { analytics } = renderReportingHook({ ...settledNameLookup, isFetching: true });

        expect(analytics.report).not.toHaveBeenCalled();
    });

    it('reports nothing before a lookup settles', () => {
        const { analytics } = renderReportingHook({ ...settledNameLookup, isSuccess: false });

        expect(analytics.report).not.toHaveBeenCalled();
    });

    it('reports nothing when there is nothing to resolve', () => {
        const { analytics } = renderReportingHook({ ...settledNameLookup, mode: 'idle' });

        expect(analytics.report).not.toHaveBeenCalled();
    });

    it('reports a direction once, however many lookups run in it', () => {
        const { rerender, analytics } = renderReportingHook(settledNameLookup);

        act(() => rerender({ ...settledNameLookup, isFetching: true }));
        act(() => rerender(settledNameLookup));

        expect(analytics.report).toHaveBeenCalledTimes(1);
    });

    it('reports both directions when the user uses both', () => {
        const { rerender, analytics } = renderReportingHook(settledNameLookup);

        act(() => rerender(settledAddressLookup));

        expect(analytics.report).toHaveBeenCalledTimes(2);
        expect(analytics.report).toHaveBeenLastCalledWith({
            type: 'send/ens-resolution',
            payload: { assetSymbol: 'eth', direction: 'reverse' },
        });
    });
});

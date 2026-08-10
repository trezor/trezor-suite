import { type NativeAnalyticsDep } from '@suite-native/analytics';
import { mockNativeAnalytics } from '@suite-native/analytics/mocks';
import { act, renderHookWithStoreProvider } from '@suite-native/test-utils-store';

import { useWrappedNativeFlowResolutionAnalytics } from './useWrappedNativeFlowResolutionAnalytics';

const renderResolutionAnalytics = (
    props: Parameters<typeof useWrappedNativeFlowResolutionAnalytics>[0],
) => {
    const services: NativeAnalyticsDep = {
        analytics: mockNativeAnalytics(jest.fn()),
    };

    const view = renderHookWithStoreProvider(useWrappedNativeFlowResolutionAnalytics, {
        initialProps: props,
        services,
    });

    return { ...view, analytics: services.analytics };
};

const pendingWrap = {
    flowType: 'wrap',
    networkSymbol: 'eth',
    status: 'pending',
    txid: 'tx-1',
} as const satisfies Parameters<typeof useWrappedNativeFlowResolutionAnalytics>[0];

describe('useWrappedNativeFlowResolutionAnalytics', () => {
    it('reports success once when the status moves from pending to confirmed', () => {
        const { rerender, analytics } = renderResolutionAnalytics(pendingWrap);

        act(() => {
            rerender({ ...pendingWrap, status: 'confirmed' });
        });

        expect(analytics.report).toHaveBeenCalledTimes(1);
        expect(analytics.report).toHaveBeenCalledWith({
            type: 'yield/wrap',
            payload: {
                type: 'success',
                action: 'continue',
                networkSymbol: 'eth',
                durationMs: expect.any(Number),
            },
        });
    });

    it('reports an on-chain-failure error when the status moves to failed', () => {
        const pendingUnwrap = { ...pendingWrap, flowType: 'unwrap' } as const;
        const { rerender, analytics } = renderResolutionAnalytics(pendingUnwrap);

        act(() => {
            rerender({ ...pendingUnwrap, status: 'failed' });
        });

        expect(analytics.report).toHaveBeenCalledTimes(1);
        expect(analytics.report).toHaveBeenCalledWith({
            type: 'yield/unwrap',
            payload: {
                type: 'error',
                action: 'continue',
                networkSymbol: 'eth',
                durationMs: expect.any(Number),
                errorMessage: 'on-chain-failure',
            },
        });
    });

    it('reports the resolution only once when confirmed twice', () => {
        const { rerender, analytics } = renderResolutionAnalytics(pendingWrap);

        act(() => {
            rerender({ ...pendingWrap, status: 'confirmed' });
        });

        act(() => {
            rerender({ ...pendingWrap, status: 'confirmed' });
        });

        expect(analytics.report).toHaveBeenCalledTimes(1);
    });

    it('reports leftPending on unmount while the transaction is still pending', () => {
        const { unmount, analytics } = renderResolutionAnalytics(pendingWrap);

        act(() => {
            unmount();
        });

        expect(analytics.report).toHaveBeenCalledWith({
            type: 'yield/wrap',
            payload: {
                type: 'leftPending',
                action: 'continue',
                networkSymbol: 'eth',
                durationMs: expect.any(Number),
            },
        });
    });

    it('does not report leftPending on unmount once the transaction already resolved', () => {
        const { rerender, unmount, analytics } = renderResolutionAnalytics(pendingWrap);

        act(() => {
            rerender({ ...pendingWrap, status: 'confirmed' });
        });

        expect(analytics.report).toHaveBeenCalledTimes(1);

        act(() => {
            unmount();
        });

        expect(analytics.report).toHaveBeenCalledTimes(1);
    });

    it('resets the resolution guard when the txid changes', () => {
        const { rerender, analytics } = renderResolutionAnalytics(pendingWrap);

        act(() => {
            rerender({ ...pendingWrap, status: 'confirmed' });
        });

        expect(analytics.report).toHaveBeenCalledTimes(1);

        act(() => {
            rerender({ ...pendingWrap, status: 'pending', txid: 'tx-2' });
        });

        act(() => {
            rerender({ ...pendingWrap, status: 'confirmed', txid: 'tx-2' });
        });

        expect(analytics.report).toHaveBeenCalledTimes(2);
    });
});
